/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: OrderService.gs
 * ROLE: Core Sales Database Transactions & Concurrency Engine (Lock Protected)
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var OrderService = {
  /**
   * Safe transaction entry representing checkout purchases.
   * Locked to handle high concurrency, checks for duplicate Order ID, logs audit traces, and updates grids.
   * @param {Object} p - Standard validated order payload object.
   * @return {Object} Status response containing row index and codes.
   */
  insertOrder: function(p) {
    var lock = LockService.getScriptLock();
    var isLocked = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
    
    if (!isLocked) {
      throw new Error("Transactional lock timeout. Sheet database is congested with concurrent checkout requests.");
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!sheet) {
        throw new Error("Orders sheet not found in parent spreadsheet.");
      }

      var orderIdIndex = CONFIG.HEADERS.ORDERS.indexOf("Order ID") + 1; // Col 2 (B)
      var duplicateRow = this.findRowByOrderId(sheet, p.orderId, orderIdIndex);
      
      if (duplicateRow !== -1) {
        throw new Error("Duplicate Order detected. Order ID " + p.orderId + " is already recorded in row " + duplicateRow);
      }

      var rowValues = this.mapPayloadToRowArray(p);
      sheet.appendRow(rowValues);
      var appendedRowIndex = sheet.getLastRow();
      
      // Keep spreadsheet newest first
      this.sortOrdersNewestFirst(sheet);

      // Log history markers
      HistoryService.logOrderStatus(p.orderId, "", p.orderStatus || "Pending", "System Webhook");
      HistoryService.logPaymentStatus(p.orderId, "", p.paymentStatus || "Pending", "System Webhook");
      AuditService.log("Order Inserted", p.orderId, "New checkout captured successfully.");

      // Refresh sheets visual stylings
      this.beautifyOrdersSheet(sheet);

      // Execute background calculations asynchronously or during idle times
      // We perform quick update immediately for live dashboards
      this.updateDependentMetrics();

      // Trigger Emails in insulated try-catch loops
      try {
        EmailService.sendOrderStatusNotification(p, p.orderStatus || "Pending");
      } catch (emErr) {
        console.error("Non-fatal confirmation email failed: " + emErr.toString());
      }

      try {
        EmailService.sendAdminAlertNotification(p);
      } catch (adErr) {
        console.error("Non-fatal admin alert email failed: " + adErr.toString());
      }

      return {
        success: true,
        code: "ORDER_CREATED",
        orderId: p.orderId,
        row: appendedRowIndex
      };

    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Updates an existing order record with new status, tracking, or notes.
   * @param {Object} p - Order payload containing modifications.
   * @return {Object} Status response.
   */
  updateOrder: function(p) {
    var lock = LockService.getScriptLock();
    var isLocked = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
    
    if (!isLocked) {
      throw new Error("Transactional lock timeout. Sheet database is congested.");
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!sheet) throw new Error("Orders sheet not found.");

      var orderIdIndex = CONFIG.HEADERS.ORDERS.indexOf("Order ID") + 1; // Col 2 (B)
      var row = this.findRowByOrderId(sheet, p.orderId, orderIdIndex);

      if (row === -1) {
        throw new Error("Update aborted. Order ID " + p.orderId + " does not exist in the ledger.");
      }

      // Read current state values
      var colPaymentStatus = CONFIG.HEADERS.ORDERS.indexOf("Payment Status") + 1;
      var colOrderStatus = CONFIG.HEADERS.ORDERS.indexOf("Order Status") + 1;
      var colNotes = CONFIG.HEADERS.ORDERS.indexOf("Notes") + 1;

      var currentPayment = sheet.getRange(row, colPaymentStatus).getValue();
      var currentOrder = sheet.getRange(row, colOrderStatus).getValue();
      var currentNotes = sheet.getRange(row, colNotes).getValue();

      // Ensure manual operations notes are preserved if not provided in payload
      if (p.notes === undefined || p.notes === null || p.notes.toString().trim() === "") {
        p.notes = currentNotes;
      }

      // Check for fulfillment state transitions
      var statusChanged = false;
      if (p.orderStatus && p.orderStatus !== currentOrder) {
        HistoryService.logOrderStatus(p.orderId, currentOrder, p.orderStatus, "System Webhook");
        AuditService.log("Fulfillment State Transition", p.orderId, "Fulfillment state moved from '" + currentOrder + "' to '" + p.orderStatus + "'");
        statusChanged = true;
      }

      // Check for payment state transitions
      if (p.paymentStatus && p.paymentStatus !== currentPayment) {
        HistoryService.logPaymentStatus(p.orderId, currentPayment, p.paymentStatus, "System Webhook");
        AuditService.log("Financial State Transition", p.orderId, "Payment state moved from '" + currentPayment + "' to '" + p.paymentStatus + "'");
      }

      // Map payload updates to matching cell values
      var updatedValues = this.mapPayloadToRowArray(p);
      sheet.getRange(row, 1, 1, CONFIG.HEADERS.ORDERS.length).setValues([updatedValues]);

      this.beautifyOrdersSheet(sheet);
      this.updateDependentMetrics();

      // If status changed, notify customer in isolation
      if (statusChanged) {
        try {
          EmailService.sendOrderStatusNotification(p, p.orderStatus);
        } catch (emErr) {
          console.error("Fulfillment notification email failed: " + emErr.toString());
        }
      }

      return {
        success: true,
        code: "ORDER_UPDATED",
        orderId: p.orderId,
        row: row
      };

    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Deletes an order record from the ledger.
   * @param {string} orderId - The target order identifier.
   * @return {Object} Status response.
   */
  deleteOrder: function(orderId) {
    var lock = LockService.getScriptLock();
    var isLocked = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
    
    if (!isLocked) {
      throw new Error("Transactional lock timeout. Sheet database is congested.");
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!sheet) throw new Error("Orders sheet not found.");

      var orderIdIndex = CONFIG.HEADERS.ORDERS.indexOf("Order ID") + 1; // Col 2 (B)
      var row = this.findRowByOrderId(sheet, orderId, orderIdIndex);

      if (row === -1) {
        throw new Error("Delete aborted. Order ID " + orderId + " does not exist in the ledger.");
      }

      sheet.deleteRow(row);
      
      AuditService.log("Order Deleted", orderId, "Order removed from spreadsheet ledger via API command.");
      this.updateDependentMetrics();

      return {
        success: true,
        code: "ORDER_DELETED",
        orderId: orderId
      };

    } finally {
      lock.releaseLock();
    }
  },

  /**
   * Fast high performance lookup searching for row containing orderId.
   */
  findRowByOrderId: function(sheet, orderId, orderIdColumn) {
    if (!orderId) return -1;
    var cleanId = orderId.toString().trim().toLowerCase();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return -1;

    // Direct memory pull to avoid cell-by-cell loops
    var data = sheet.getRange(2, orderIdColumn, lastRow - 1, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().trim().toLowerCase() === cleanId) {
        return i + 2; // Rows are 1-indexed, and we skipped headers
      }
    }
    return -1;
  },

  /**
   * Custom field mapping translation.
   */
  mapPayloadToRowArray: function(p) {
    var timestamp = p.timestamp ? new Date(p.timestamp) : new Date();
    var orderDate = p.orderDate ? p.orderDate.toString() : Utils.formatDateTimeInDhaka(timestamp).substring(0, 10);
    
    return [
      Utils.formatDateTimeInDhaka(timestamp),                       // Timestamp Col A
      p.orderId ? p.orderId.toString().trim() : "N/A",              // Order ID Col B
      orderDate,                                                    // Order Date Col C
      p.customerName ? p.customerName.toString().trim() : "N/A",    // Customer Name Col D
      p.phone ? p.phone.toString().trim() : "N/A",                  // Phone Col E
      p.email ? p.email.toString().trim() : "N/A",                  // Email Col F
      p.address ? p.address.toString().trim() : "N/A",              // Address Col G
      p.division ? p.division.toString().trim() : "N/A",            // Division Col H
      p.district ? p.district.toString().trim() : "N/A",            // District Col I
      p.postalCode ? p.postalCode.toString().trim() : "",           // Postal Code Col J
      p.paymentMethod ? p.paymentMethod.toString().trim() : "COD",  // Payment Method Col K
      p.paymentStatus ? p.paymentStatus.toString().trim() : "Pending", // Payment Status Col L
      p.orderStatus ? p.orderStatus.toString().trim() : "Pending",     // Order Status Col M
      p.products ? p.products.toString().trim() : "",               // Products Col N
      p.sizes ? p.sizes.toString().trim() : "",                     // Sizes Col O
      p.colors ? p.colors.toString().trim() : "",                   // Colors Col P
      p.quantity !== undefined ? Number(p.quantity) : 1,            // Quantity Col Q
      p.unitPrice !== undefined ? Number(p.unitPrice) : 0,          // Unit Price Col R
      p.subtotal !== undefined ? Number(p.subtotal) : 0,            // Subtotal Col S
      p.deliveryCharge !== undefined ? Number(p.deliveryCharge) : 0,// Delivery Charge Col T
      p.discount !== undefined ? Number(p.discount) : 0,            // Discount Col U
      p.grandTotal !== undefined ? Number(p.grandTotal) : 0,        // Grand Total Col V
      p.courierName ? p.courierName.toString().trim() : "",         // Courier Name Col W
      p.trackingNumber ? p.trackingNumber.toString().trim() : "",   // Tracking Number Col X
      p.trackingUrl ? p.trackingUrl.toString().trim() : "",         // Tracking URL Col Y
      p.notes ? p.notes.toString().trim() : "",                     // Notes Col Z
      p.customerIp ? p.customerIp.toString().trim() : "127.0.0.1",  // Customer IP Col AA
      p.browser ? p.browser.toString().trim() : "Server Agent"      // Browser Col AB
    ];
  },

  /**
   * Sorts orders such that newest always sit on row 2, maintaining timeline focus.
   */
  sortOrdersNewestFirst: function(sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 2) return;
    // Sort on Col B (Order ID or Timestamp Col A descending)
    sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.ORDERS.length).sort({ column: 1, ascending: false });
  },

  /**
   * Updates customer, products lists and forces dashboard refresh in single sequential cycle.
   */
  updateDependentMetrics: function() {
    try {
      CustomerService.reindexAllCustomers();
      ProductService.reindexAllProducts();
      ReportService.generateReportLedger();
      AnalyticsService.generateOperationalCharts();
    } catch (e) {
      console.error("Metric sync failure: " + e.toString());
    }
  },

  /**
   * Premium layout styling for Orders sheet.
   */
  beautifyOrdersSheet: function(sheet) {
    try {
      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) return;

      var totalCols = CONFIG.HEADERS.ORDERS.length;
      
      // Formatting
      sheet.getRange(2, 1, lastRow - 1, totalCols).setFontFamily("Inter").setFontSize(9);
      sheet.getRange(2, 18, lastRow - 1, 5).setNumberFormat("৳#,##0"); // Currencies pricing formatting
      
      Utils.applyZebraStriping(sheet, 2, lastRow, totalCols);
      
      // Add dynamic dropdown data validations on Status cols
      var colPaymentStatus = CONFIG.HEADERS.ORDERS.indexOf("Payment Status") + 1;
      var colOrderStatus = CONFIG.HEADERS.ORDERS.indexOf("Order Status") + 1;

      var paymentRule = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.PAYMENT_STATUSES).build();
      var orderRule = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.ORDER_STATUSES).build();

      sheet.getRange(2, colPaymentStatus, lastRow - 1, 1).setDataValidation(paymentRule);
      sheet.getRange(2, colOrderStatus, lastRow - 1, 1).setDataValidation(orderRule);

      this.applyOrderStatusFormatting(sheet, lastRow, colOrderStatus, colPaymentStatus);
      
      sheet.autoResizeColumns(1, totalCols);
    } catch (e) {
      console.error("Error formatting Orders sheet: " + e.toString());
    }
  },

  /**
   * Status-based cell coloring formatting.
   */
  applyOrderStatusFormatting: function(sheet, lastRow, colOrderStatus, colPaymentStatus) {
    // We can apply native formatting or direct styling depending on sheet loads.
    // For high speed performance, we look at rows and apply colors.
    for (var r = 2; r <= lastRow; r++) {
      try {
        var ordStatus = sheet.getRange(r, colOrderStatus).getValue().toString().toUpperCase();
        var payStatus = sheet.getRange(r, colPaymentStatus).getValue().toString().toUpperCase();

        var ordColor = CONFIG.THEME.STATUS[ordStatus] || { BG: "#FFFFFF", TEXT: "#000000" };
        var payColor = CONFIG.THEME.PAYMENT[payStatus] || { BG: "#FFFFFF", TEXT: "#000000" };

        sheet.getRange(r, colOrderStatus).setBackground(ordColor.BG).setFontColor(ordColor.TEXT).setFontWeight("bold");
        sheet.getRange(r, colPaymentStatus).setBackground(payColor.BG).setFontColor(payColor.TEXT).setFontWeight("bold");
      } catch (err) {}
    }
  }
};
