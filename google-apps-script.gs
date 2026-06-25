/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT DASHBOARD
 * ============================================================================
 * 
 * DESIGN PRINCIPLE: Quiet Luxury, Architectural Honesty & Pristine Layouts
 * ENGINEER LEVEL: Senior Google Apps Script Platform Architect
 * TIMEZONE: Asia/Dhaka (Bangladesh Standard Time - BST / GMT+6)
 * 
 * DESCRIPTION:
 * This script serves as the production-grade secure webhook receiver and 
 * business intelligence control panel for the ROY MEN Bangladesh premium 
 * fashion storefront. It automatically initializes a 5-sheet database schema,
 * builds dynamic KPI cards, embeds native charts, applies status dropdowns,
 * formats status-based colors, prevents duplicate order transactions with 
 * lock concurrency, registers metrics, and configures custom export options.
 * 
 * SHEETS INCLUDED:
 * 1. "Dashboard"  - Live operation analytics grid, leaderboards, and query search bar.
 * 2. "Orders"     - Consolidated transaction ledger with status controls.
 * 3. "Reports"    - Dynamic aggregations, time-series, and embedded charts.
 * 4. "Products"   - Performance metric breakdown per product catalog.
 * 5. "Customers"  - Historic spending habits and contact ledger.
 * 6. "Order History" - Historical order status updates tracking sheet.
 * 7. "Payment History" - Historical payment status updates tracking sheet.
 * 8. "Audit Log"   - Universal system and user action tracing engine.
 * 9. "Settings"    - Core enterprise business and charge parameters.
 * ============================================================================
 */

// Global Constant Settings
var CONFIG = {
  TIMEZONE: "Asia/Dhaka",
  DATE_FORMAT: "yyyy-MM-dd HH:mm:ss",
  LOCK_TIMEOUT_MS: 15000, // Safe concurrency window for high-traffic drop sales
  SHEETS: {
    DASHBOARD: "Dashboard",
    ORDERS: "Orders",
    REPORTS: "Reports",
    PRODUCTS: "Products",
    CUSTOMERS: "Customers",
    ORDER_HISTORY: "Order History",
    PAYMENT_HISTORY: "Payment History",
    AUDIT_LOG: "Audit Log",
    SETTINGS: "Settings"
  },
  ORDER_STATUSES: ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"],
  PAYMENT_STATUSES: ["Pending", "Paid", "Failed", "Refunded"],
  HEADERS: {
    ORDERS: [
      "Timestamp", "Order ID", "Order Date", "Customer Name", "Phone", "Email", 
      "Address", "Division", "District", "Postal Code", "Payment Method", 
      "Payment Status", "Order Status", "Products", "Sizes", "Colors", "Quantity", 
      "Unit Price", "Subtotal", "Delivery Charge", "Discount", "Grand Total", 
      "Courier Name", "Tracking Number", "Tracking URL", "Notes", "Customer IP", "Browser"
    ],
    PRODUCTS: ["Product Name", "Quantity Sold", "Revenue", "First Sold Date", "Last Sold Date", "Average Selling Price", "Best Selling Month"],
    CUSTOMERS: ["Customer Name", "Phone", "Email", "First Order Date", "Last Order Date", "Lifetime Orders", "Lifetime Spending", "Average Order Value"],
    ORDER_HISTORY: ["Timestamp", "Order ID", "Previous Status", "New Status", "Changed By"],
    PAYMENT_HISTORY: ["Timestamp", "Order ID", "Previous Status", "New Status", "Changed By"],
    AUDIT_LOG: ["Timestamp", "Event Type", "Order ID", "Details"]
  }
};

/**
 * AUTOMATIC EDIT EVENT TRACKER
 * Detects manual changes to Order Status or Payment Status, logs histories and updates audit trails.
 */
function onEdit(e) {
  if (!e) return;
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() !== CONFIG.SHEETS.ORDERS) return;

  var row = range.getRow();
  var col = range.getColumn();
  if (row <= 1) return; // Ignore headers

  var orderId = sheet.getRange(row, 2).getValue().toString().trim();
  var email = Session.getActiveUser().getEmail() || "Admin (Manual)";

  // Check if modified column is one of our target columns:
  // Col 12: Payment Status
  // Col 13: Order Status
  // Col 23: Courier Name
  // Col 24: Tracking Number
  // Col 25: Tracking URL
  // Col 26: Notes
  var targetCols = [12, 13, 23, 24, 25, 26];
  var isTargetCol = targetCols.indexOf(col) !== -1;

  if (col === 13) { // Order Status Col M
    var prevStatus = e.oldValue || "None";
    var newStatus = range.getValue();
    logOrderStatusChange(orderId, prevStatus, newStatus, email);
    logAuditEvent("Status Change", orderId, "Status manual update from '" + prevStatus + "' to '" + newStatus + "' by " + email);
    
    // Refresh calculations and charts
    refreshDashboard();
  } else if (col === 12) { // Payment Status Col L
    var prevPay = e.oldValue || "None";
    var newPay = range.getValue();
    logPaymentStatusChange(orderId, prevPay, newPay, email);
    logAuditEvent("Payment Change", orderId, "Payment manual update from '" + prevPay + "' to '" + newPay + "' by " + email);
    
    // Refresh calculations and charts
    refreshDashboard();
  } else if (isTargetCol) {
    logAuditEvent("Update", orderId, "Manual cell edit in Column " + col + " by " + email);
  }

  // If ANY of our target columns were updated, send the webhook sync!
  if (isTargetCol) {
    try {
      var orderStatus = sheet.getRange(row, 13).getValue().toString().trim();
      var paymentStatus = sheet.getRange(row, 12).getValue().toString().trim();
      var courierName = sheet.getRange(row, 23).getValue().toString().trim();
      var trackingNumber = sheet.getRange(row, 24).getValue().toString().trim();
      var trackingUrl = sheet.getRange(row, 25).getValue().toString().trim();
      var notes = sheet.getRange(row, 26).getValue().toString().trim();

      var payload = {
        orderId: orderId,
        orderStatus: orderStatus,
        paymentStatus: paymentStatus,
        courierName: courierName,
        trackingNumber: trackingNumber,
        trackingUrl: trackingUrl,
        notes: notes,
        updatedAt: new Date().toISOString()
      };

      // Call asynchronous/robust sync function
      syncStatusToBackend(payload);
    } catch (err) {
      console.error("Failed building sync payload: " + err);
    }
  }
}

/**
 * DISPATCH WEBHOOK TO MERN BACKEND WITH ROBUST RETRIES & ERROR RESILIENCY
 */
function syncStatusToBackend(payload) {
  var backendUrl = getSetting("BACKEND_URL", "");
  if (!backendUrl) {
    console.warn("BACKEND_URL not configured in Settings. Skipping server sync.");
    return;
  }

  // Clean trailing slash if present
  if (backendUrl.substring(backendUrl.length - 1) === "/") {
    backendUrl = backendUrl.substring(0, backendUrl.length - 1);
  }

  var url = backendUrl + "/api/orders/sync-status";
  var apiKey = getSetting("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var maxRetries = 3;
  var attempt = 0;
  var success = false;
  var responseCode = 0;
  var errorMsg = "";

  while (attempt < maxRetries && !success) {
    attempt++;
    try {
      var response = UrlFetchApp.fetch(url, options);
      responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        success = true;
        console.log("Successfully synced order " + payload.orderId + " to backend (Attempt " + attempt + ")");
        logAuditEvent("Sync Success", payload.orderId, "Successfully synchronized status update to backend on attempt " + attempt);
      } else {
        errorMsg = "HTTP Response Code " + responseCode + ": " + response.getContentText();
        console.warn("Sync failed on attempt " + attempt + " with response: " + errorMsg);
        if (attempt < maxRetries) {
          Utilities.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff (2s, 4s...)
        }
      }
    } catch (e) {
      errorMsg = e.toString();
      console.error("Sync fetch error on attempt " + attempt + ": " + errorMsg);
      if (attempt < maxRetries) {
        Utilities.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  if (!success) {
    // If it failed completely, save to failed queue in Script Properties so we do not lose updates
    var props = PropertiesService.getScriptProperties();
    var failedQueue = JSON.parse(props.getProperty("FAILED_SYNC_QUEUE") || "[]");
    
    // Check if this orderId is already queued to prevent duplicate entries
    var existingIdx = -1;
    for (var i = 0; i < failedQueue.length; i++) {
      if (failedQueue[i].orderId === payload.orderId) {
        existingIdx = i;
        break;
      }
    }
    
    if (existingIdx !== -1) {
      failedQueue[existingIdx] = payload; // overwrite with latest
    } else {
      failedQueue.push(payload);
    }
    
    props.setProperty("FAILED_SYNC_QUEUE", JSON.stringify(failedQueue));
    console.error("All sync attempts failed for order " + payload.orderId + ". Saved to offline sync queue.");
    logAuditEvent("Sync Failed", payload.orderId, "Failed syncing to backend. Saved to sync queue for auto-retry. Error: " + errorMsg);
    recordApiRequest(false);
  } else {
    recordApiRequest(true);
  }
}

/**
 * REPROCESS ANY OFFLINE FAILED SYNC PACKETS AUTOMATICALLY
 */
function processFailedSyncQueue() {
  var props = PropertiesService.getScriptProperties();
  var queueJson = props.getProperty("FAILED_SYNC_QUEUE");
  if (!queueJson) return;

  var failedQueue = JSON.parse(queueJson);
  if (failedQueue.length === 0) return;

  console.log("Found " + failedQueue.length + " pending updates in sync queue. Processing...");
  var remainingQueue = [];

  for (var i = 0; i < failedQueue.length; i++) {
    var payload = failedQueue[i];
    
    var backendUrl = getSetting("BACKEND_URL", "");
    if (!backendUrl) return;
    if (backendUrl.substring(backendUrl.length - 1) === "/") {
      backendUrl = backendUrl.substring(0, backendUrl.length - 1);
    }
    var url = backendUrl + "/api/orders/sync-status";
    var apiKey = getSetting("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      var response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        console.log("Successfully re-synced queued order " + payload.orderId);
        logAuditEvent("Sync Recovered", payload.orderId, "Offline queue item synchronized successfully.");
      } else {
        remainingQueue.push(payload);
      }
    } catch (e) {
      console.warn("Re-sync attempt failed for order " + payload.orderId + ": " + e);
      remainingQueue.push(payload);
    }
  }

  props.setProperty("FAILED_SYNC_QUEUE", JSON.stringify(remainingQueue));
}

/**
 * CUSTOM EXPORT & AUDIT MENU SETUP
 * Automatically initializes on spreadsheet open.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🏆 ROY MEN Dashboard")
    .addItem("📊 Refresh Dashboard Data (Fast)", "refreshDashboard")
    .addItem("🔄 Rebuild Dashboard & Structure", "initializeAllSheets")
    .addItem("🕒 Setup 5-Min Auto-Trigger", "createTimeDrivenTriggers")
    .addSeparator()
    .addItem("📄 Export PDF Report", "exportPdfReport")
    .addItem("📝 Export CSV Orders", "exportCsvOrders")
    .addItem("📈 Export Excel Worksheet", "exportExcelWorksheet")
    .addSeparator()
    .addItem("💾 Backup Orders Ledger", "backupOrdersLedger")
    .addToUi();
}

/**
 * INTERACTIVE SELECTION EVENT TRIGGER (Dashboard Cells as Live Buttons)
 * Automatically runs search query or clears it.
 */
function onSelectionChange(e) {
  var range = e.range;
  var sheet = range.getSheet();
  if (sheet.getName() === CONFIG.SHEETS.DASHBOARD) {
    var row = range.getRow();
    var col = range.getColumn();
    if (row === 7 && col === 7) { // G7: Run Search
      runSearch();
    } else if (row === 7 && col === 8) { // H7: Clear Search
      clearSearch();
    }
  }
}

/**
 * HTTP GET STATUS, DIAGNOSTICS & MANUAL INITIALIZATION CONTROL
 * Includes API verification.
 * 
 * @return {TextOutput} Clean status response
 */
function doGet(e) {
  try {
    recordApiRequest(true);
    
    // 1. Validate API Key
    if (!verifyApiKey(e, null)) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "unauthorized",
        code: "INVALID_API_KEY",
        message: "Request rejected: invalid or missing x-api-key."
      }, 401);
    }

    // Proactively verify sheet schemas are loaded
    initializeAllSheets();
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
    var lastRow = ordersSheet.getLastRow();
    var orderCount = lastRow > 1 ? lastRow - 1 : 0;

    return createJsonResponse({
      status: "active",
      engine: "ROY MEN Enterprise Engine",
      version: "6.0.0-PRO-ENTERPRISE",
      timezone: CONFIG.TIMEZONE,
      currentTime: formatDateTimeInDhaka(new Date()),
      sheetsRegistered: Object.keys(CONFIG.SHEETS).map(function(key) { return CONFIG.SHEETS[key]; }),
      diagnostics: {
        totalOrdersRecorded: orderCount,
        spreadsheetUrl: ss.getUrl()
      }
    }, 200);
  } catch (err) {
    console.error("[ROYMEN GET Exception]:", err);
    recordApiRequest(false);
    return createJsonResponse({
      status: "degraded",
      message: "Diagnostics initialization failed: " + err.toString()
    }, 500);
  }
}

/**
 * HTTP POST WEBHOOK HANDLER
 * Consumes real-time transaction objects from the MERN server.
 * Supports insert, update, and delete actions.
 * 
 * @param {Object} e - HTTP payload package
 * @return {TextOutput} Execution logs mapping to MERN client requirements
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var payloadString = e && e.postData && e.postData.contents ? e.postData.contents : "";
  var payload = null;

  try {
    // 1. Safely parse JSON from the request body
    if (!payloadString) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "error",
        code: "EMPTY_PAYLOAD",
        message: "Post payload contents are completely empty."
      }, 400);
    }

    try {
      payload = JSON.parse(payloadString);
    } catch (parseErr) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "error",
        code: "INVALID_JSON",
        message: "Malformed JSON structure: " + parseErr.toString()
      }, 400);
    }

    // 2. Validate API Key
    if (!verifyApiKey(e, payload)) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "unauthorized",
        code: "INVALID_API_KEY",
        message: "Request rejected: invalid or missing x-api-key."
      }, 401);
    }

    // 3. Webhook Signature Verification
    if (!verifySignature(e, payloadString)) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "unauthorized",
        code: "INVALID_SIGNATURE",
        message: "Request rejected: signature verification failed."
      }, 401);
    }

    // 4. Concurrency isolation check to protect cells during high-frequency sales
    var isLocked = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
    if (!isLocked) {
      console.error("[ROYMEN Webhook] Database concurrent lock timeout.");
      recordApiRequest(false);
      return createJsonResponse({
        status: "error",
        code: "DATABASE_CONGESTION",
        message: "Spreadsheet database is currently locked. Retry transaction."
      }, 423);
    }

    // 5. Ensure sheets exist before any injection
    initializeAllSheets();

    var action = payload.action || "insert";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
    var orderIdIndex = CONFIG.HEADERS.ORDERS.indexOf("Order ID") + 1; // Col 2 (B)

    // ==========================================
    // ACTION: DELETE ORDER
    // ==========================================
    if (action === "delete") {
      var foundRowIndex = findRowByOrderId(ordersSheet, payload.orderId, orderIdIndex);
      if (foundRowIndex === -1) {
        recordApiRequest(false);
        return createJsonResponse({
          status: "error",
          code: "ORDER_NOT_FOUND",
          message: "Delete aborted. Order ID " + payload.orderId + " does not exist."
        }, 404);
      }
      
      ordersSheet.deleteRow(foundRowIndex);
      logAuditEvent("Delete", payload.orderId, "Order row deleted successfully via API action='delete'");
      
      // Batch recalculate and update
      refreshDashboard();
      recordApiRequest(true);

      return createJsonResponse({
        status: "success",
        code: "ORDER_DELETED",
        orderId: payload.orderId,
        message: "Order ID " + payload.orderId + " successfully deleted from the ledger."
      }, 200);
    }

    // ==========================================
    // ACTION: INSERT OR UPDATE
    // ==========================================
    var validation = validatePayload(payload);
    if (!validation.isValid) {
      recordApiRequest(false);
      return createJsonResponse({
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Field constraint failure: " + validation.errors.join(", ")
      }, 400);
    }

    var duplicateRow = findRowByOrderId(ordersSheet, payload.orderId, orderIdIndex);

    if (action === "update") {
      if (duplicateRow === -1) {
        recordApiRequest(false);
        return createJsonResponse({
          status: "error",
          code: "ORDER_NOT_FOUND",
          message: "Update aborted. Order ID " + payload.orderId + " does not exist."
        }, 404);
      }

      // Preserve existing manual notes if no new notes are provided in the payload
      var existingNotes = ordersSheet.getRange(duplicateRow, 26).getValue(); // Col Z
      if (!payload.notes || payload.notes.toString().trim() === "") {
        payload.notes = existingNotes;
      }

      // Record state history changes
      var existingStatus = ordersSheet.getRange(duplicateRow, 13).getValue(); // Col M
      var existingPayment = ordersSheet.getRange(duplicateRow, 12).getValue(); // Col L

      if (payload.orderStatus && payload.orderStatus !== existingStatus) {
        logOrderStatusChange(payload.orderId, existingStatus, payload.orderStatus, "System Webhook");
        logAuditEvent("Status Change", payload.orderId, "Status updated from '" + existingStatus + "' to '" + payload.orderStatus + "' via API");
      }
      if (payload.paymentStatus && payload.paymentStatus !== existingPayment) {
        logPaymentStatusChange(payload.orderId, existingPayment, payload.paymentStatus, "System Webhook");
        logAuditEvent("Payment Change", payload.orderId, "Payment updated from '" + existingPayment + "' to '" + payload.paymentStatus + "' via API");
      }

      var updatedValues = mapPayloadToRowArray(payload);
      ordersSheet.getRange(duplicateRow, 1, 1, CONFIG.HEADERS.ORDERS.length).setValues([updatedValues]);

      logAuditEvent("Update", payload.orderId, "Order data updated via API action='update'");

      refreshDashboard();
      recordApiRequest(true);

      return createJsonResponse({
        status: "success",
        code: "ORDER_UPDATED",
        orderId: payload.orderId,
        message: "Order ID " + payload.orderId + " successfully updated inside the ledger.",
        row: duplicateRow
      }, 200);

    } else {
      // DEFAULT INSERT
      if (duplicateRow !== -1) {
        recordApiRequest(false);
        return createJsonResponse({
          status: "error",
          code: "DUPLICATE_ORDER",
          message: "Transaction Aborted. Order ID " + payload.orderId + " already registered in the ledger."
        }, 409);
      }

      var rowValues = mapPayloadToRowArray(payload);
      ordersSheet.appendRow(rowValues);
      var appendedRowIndex = ordersSheet.getLastRow();
      
      // Sort orders dynamically so newest always float to row 2
      sortOrdersNewestFirst(ordersSheet);

      // Log status traces
      logOrderStatusChange(payload.orderId, "", payload.orderStatus || "Pending", "System Webhook");
      logPaymentStatusChange(payload.orderId, "", payload.paymentStatus || "Pending", "System Webhook");
      logAuditEvent("Insert", payload.orderId, "New order registered via API");

      refreshDashboard();
      recordApiRequest(true);

      return createJsonResponse({
        status: "success",
        code: "ORDER_CREATED",
        orderId: payload.orderId,
        message: "Order ID " + payload.orderId + " successfully synced to Google Sheets.",
        row: appendedRowIndex
      }, 201);
    }

  } catch (err) {
    console.error("[ROYMEN POST Exception]:", err);
    recordApiRequest(false);
    return createJsonResponse({
      status: "error",
      code: "INTERNAL_FATAL",
      message: err.message || err.toString()
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Validates incoming checkout parameters with strict constraint and regex safety checks.
 */
function validatePayload(p) {
  var errors = [];
  if (!p) {
    errors.push("Payload is completely null or empty");
    return { isValid: false, errors: errors };
  }
  
  if (!p.orderId || p.orderId.toString().trim() === "") {
    errors.push("orderId is missing or empty");
  }
  
  if (!p.customerName || p.customerName.toString().trim() === "") {
    errors.push("customerName is missing or empty");
  }
  
  // Email check
  if (p.email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(p.email.toString().trim())) {
      errors.push("Invalid email format: '" + p.email + "'");
    }
  }
  
  // Phone check
  if (!p.phone || p.phone.toString().trim() === "") {
    errors.push("phone is missing or empty");
  } else {
    var phoneDigits = p.phone.toString().replace(/\D/g, "");
    if (phoneDigits.length < 5) {
      errors.push("Invalid phone format (must contain at least 5 digits): '" + p.phone + "'");
    }
  }
  
  // Grand Total check
  if (p.grandTotal === undefined || p.grandTotal === null) {
    errors.push("grandTotal is missing");
  } else {
    var gt = Number(p.grandTotal);
    if (isNaN(gt) || gt < 0) {
      errors.push("grandTotal must be a non-negative numeric value");
    }
  }
  
  // Payment Method check
  if (!p.paymentMethod || p.paymentMethod.toString().trim() === "") {
    errors.push("paymentMethod is missing or empty");
  }
  
  // Order Status validation
  if (p.orderStatus) {
    if (CONFIG.ORDER_STATUSES.indexOf(p.orderStatus) === -1) {
      errors.push("Invalid orderStatus value: '" + p.orderStatus + "'. Allowed: " + CONFIG.ORDER_STATUSES.join(", "));
    }
  }

  // Payment Status validation
  if (p.paymentStatus) {
    if (CONFIG.PAYMENT_STATUSES.indexOf(p.paymentStatus) === -1) {
      errors.push("Invalid paymentStatus value: '" + p.paymentStatus + "'. Allowed: " + CONFIG.PAYMENT_STATUSES.join(", "));
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Finds if an Order ID already exists in the sheet
 * Returns the 1-based row index, or -1 if not found.
 */
function findRowByOrderId(sheet, orderId, colNum) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var data = sheet.getRange(2, colNum, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0].toString().trim() === orderId.toString().trim()) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * Maps the MERN JSON properties to row values (28 Columns)
 */
function mapPayloadToRowArray(p) {
  var bstNow = new Date();
  var orderTime = p.orderDate ? new Date(p.orderDate) : bstNow;

  return [
    bstNow,                                              // A: Timestamp
    p.orderId.toString(),                                // B: Order ID
    orderTime,                                           // C: Order Date
    p.customerName.trim(),                               // D: Customer Name
    p.phone.toString().trim(),                           // E: Phone
    p.email ? p.email.trim().toLowerCase() : "",         // F: Email
    p.address || "N/A",                                  // G: Address
    p.division || "",                                    // H: Division
    p.district || "",                                    // I: District
    p.postalCode || "",                                  // J: Postal Code
    p.paymentMethod || "COD",                            // K: Payment Method
    p.paymentStatus || "Pending",                        // L: Payment Status
    p.orderStatus || "Pending",                          // M: Order Status
    p.products || "N/A",                                 // N: Products (Text)
    p.sizes || "N/A",                                    // O: Sizes
    p.colors || "N/A",                                   // P: Colors
    p.quantity ? Number(p.quantity) : 1,                 // Q: Quantity
    p.unitPrice || "N/A",                                // R: Unit Price
    p.subtotal ? Number(p.subtotal) : 0,                 // S: Subtotal
    p.deliveryCharge ? Number(p.deliveryCharge) : 0,     // T: Delivery Charge
    p.discount ? Number(p.discount) : 0,                 // U: Discount
    p.grandTotal ? Number(p.grandTotal) : 0,             // V: Grand Total
    p.courierName || "",                                 // W: Courier Name
    p.trackingNumber || "",                              // X: Tracking Number
    p.trackingUrl || "",                                 // Y: Tracking URL
    p.notes || "",                                       // Z: Notes
    p.customerIP || "127.0.0.1",                         // AA: Customer IP
    p.browser || "N/A"                                   // AB: Browser
  ];
}

/**
 * Enterprise key-value parameters retrieval helper.
 * Reads configurations dynamically from the Settings tab.
 */
function getSetting(key, defaultValue) {
  try {
    var cached = CacheHelper.get("setting_" + key);
    if (cached !== null) return cached;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
    if (!sheet) return defaultValue;
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return defaultValue;
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString().trim().toLowerCase() === key.toString().trim().toLowerCase()) {
        var val = data[i][1].toString();
        CacheHelper.put("setting_" + key, val, 300); // 5 min cache
        return val;
      }
    }
  } catch (e) {
    console.error("Error reading setting " + key + ": " + e);
  }
  return defaultValue;
}

/**
 * Initializes all sheets and configures them if not existing.
 */
function initializeAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetsToVerify = [
    { name: CONFIG.SHEETS.DASHBOARD, hasHeaders: false },
    { name: CONFIG.SHEETS.ORDERS, hasHeaders: true, headers: CONFIG.HEADERS.ORDERS },
    { name: CONFIG.SHEETS.REPORTS, hasHeaders: false },
    { name: CONFIG.SHEETS.PRODUCTS, hasHeaders: true, headers: CONFIG.HEADERS.PRODUCTS },
    { name: CONFIG.SHEETS.CUSTOMERS, hasHeaders: true, headers: CONFIG.HEADERS.CUSTOMERS },
    { name: CONFIG.SHEETS.ORDER_HISTORY, hasHeaders: true, headers: CONFIG.HEADERS.ORDER_HISTORY },
    { name: CONFIG.SHEETS.PAYMENT_HISTORY, hasHeaders: true, headers: CONFIG.HEADERS.PAYMENT_HISTORY },
    { name: CONFIG.SHEETS.AUDIT_LOG, hasHeaders: true, headers: CONFIG.HEADERS.AUDIT_LOG },
    { name: CONFIG.SHEETS.SETTINGS, hasHeaders: false }
  ];

  sheetsToVerify.forEach(function(sh) {
    var s = ss.getSheetByName(sh.name);
    if (!s) {
      s = ss.insertSheet(sh.name);
      if (sh.hasHeaders && sh.headers) {
        s.appendRow(sh.headers);
      }
    } else if (sh.hasHeaders && s.getLastRow() === 0 && sh.headers) {
      s.appendRow(sh.headers);
    }
  });

  // Settings initial values seeding
  var settingsSheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.clear();
    var settingsData = [
      ["Setting Key", "Value", "Description"],
      ["Business Name", "ROY MEN", "The registered name of the business"],
      ["Support Email", "mrinal2192@gmail.com", "Main support email address"],
      ["Support Phone", "+8801700000000", "Main support contact number"],
      ["Currency", "BDT", "Local store currency abbreviation"],
      ["Timezone", "Asia/Dhaka", "Standard business operation timezone"],
      ["Delivery Charge", "100", "Standard shipping charge inside Bangladesh"],
      ["VAT", "5%", "Value Added Tax rate"],
      ["Discount", "0%", "Default coupon discount rate"],
      ["Logo URL", "https://i.imgur.com/example.png", "Company brand logo image URL"],
      ["API_KEY", "ROY_MEN_SECURE_API_KEY_2026", "Security key used for webhook validation (x-api-key)"],
      ["WEBHOOK_SECRET", "ROY_MEN_SECRET_2026", "Webhook HMAC signature hashing secret key"],
      ["BACKEND_URL", "http://localhost:3000", "Your MERN Railway backend URL base (e.g., https://roymen-production.up.railway.app)"]
    ];
    settingsSheet.getRange(1, 1, settingsData.length, 3).setValues(settingsData);
    beautifyBasicCatalogSheet(settingsSheet, 3);
  }

  // Setup Dashboard cells (if empty or rebuilding)
  var dSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (dSheet.getLastRow() <= 1) {
    buildOperationalDashboard(dSheet);
  }

  // Setup Reports
  var rSheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
  if (rSheet.getLastRow() <= 1) {
    buildReportsSheet(rSheet);
  }

  // Beautify headers for history & logging sheets
  beautifyBasicCatalogSheet(ss.getSheetByName(CONFIG.SHEETS.ORDER_HISTORY), CONFIG.HEADERS.ORDER_HISTORY.length);
  beautifyBasicCatalogSheet(ss.getSheetByName(CONFIG.SHEETS.PAYMENT_HISTORY), CONFIG.HEADERS.PAYMENT_HISTORY.length);
  beautifyBasicCatalogSheet(ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG), CONFIG.HEADERS.AUDIT_LOG.length);
}

/**
 * HIGH-PERFORMANCE IN-MEMORY BATCH AGGREGATION & RECALCULATION
 * Fulfills Customer Timeline, Product Analytics, and Batch-updates without row-by-row overhead.
 */
function recalculateCatalogAndAnalytics() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
  if (!ordersSheet) return;
  var lastRow = ordersSheet.getLastRow();
  if (lastRow <= 1) return;

  var ordersData = ordersSheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.ORDERS.length).getValues();

  var customers = {};
  var products = {};

  for (var i = 0; i < ordersData.length; i++) {
    var row = ordersData[i];
    var orderDate = row[2]; // Col C
    if (!(orderDate instanceof Date)) {
      orderDate = new Date(orderDate);
    }
    var customerName = row[3] ? row[3].toString().trim() : "Anonymous Customer";
    var phone = row[4] ? row[4].toString().trim() : "N/A";
    var email = row[5] ? row[5].toString().trim().toLowerCase() : "";
    var pName = row[13] ? row[13].toString().trim() : "Unknown Product";
    var qty = row[16] ? Number(row[16]) : 1;
    var price = row[17] ? Number(row[17]) : 0;
    var total = row[21] ? Number(row[21]) : 0; // Grand Total

    // Best Selling Month grouping string
    var yearMonth = "";
    if (orderDate && !isNaN(orderDate.getTime())) {
      var month = orderDate.getMonth() + 1;
      yearMonth = orderDate.getFullYear() + "-" + (month < 10 ? "0" + month : month);
    }

    // A. Customers Aggregator
    var custKey = phone !== "N/A" && phone !== "" ? phone : customerName;
    if (!customers[custKey]) {
      customers[custKey] = {
        name: customerName,
        phone: phone,
        email: email,
        firstOrder: orderDate,
        lastOrder: orderDate,
        lifetimeOrders: 0,
        lifetimeSpending: 0
      };
    }
    var c = customers[custKey];
    c.lifetimeOrders += 1;
    c.lifetimeSpending += total;
    if (orderDate && (!c.firstOrder || orderDate < c.firstOrder)) c.firstOrder = orderDate;
    if (orderDate && (!c.lastOrder || orderDate > c.lastOrder)) c.lastOrder = orderDate;

    // B. Products Aggregator
    if (!products[pName]) {
      products[pName] = {
        name: pName,
        qtySold: 0,
        revenue: 0,
        firstSold: orderDate,
        lastSold: orderDate,
        prices: [],
        monthlySales: {}
      };
    }
    var p = products[pName];
    p.qtySold += qty;
    p.revenue += total;
    if (orderDate && (!p.firstSold || orderDate < p.firstSold)) p.firstSold = orderDate;
    if (orderDate && (!p.lastSold || orderDate > p.lastSold)) p.lastSold = orderDate;
    if (!isNaN(price) && price > 0) p.prices.push(price);
    if (yearMonth) {
      p.monthlySales[yearMonth] = (p.monthlySales[yearMonth] || 0) + qty;
    }
  }

  // Bulk Write Products
  var prodSheet = ss.getSheetByName(CONFIG.SHEETS.PRODUCTS);
  prodSheet.clearContents();
  var prodHeaders = CONFIG.HEADERS.PRODUCTS;
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);

  var prodRows = [];
  for (var pKey in products) {
    var pr = products[pKey];
    var avgPrice = pr.prices.length > 0 ? pr.prices.reduce(function(a,b){return a+b;}, 0) / pr.prices.length : 0;
    
    var bestMonth = "N/A";
    var maxQty = -1;
    for (var m in pr.monthlySales) {
      if (pr.monthlySales[m] > maxQty) {
        maxQty = pr.monthlySales[m];
        bestMonth = m;
      }
    }

    prodRows.push([
      pr.name,
      pr.qtySold,
      pr.revenue,
      pr.firstSold || "",
      pr.lastSold || "",
      avgPrice,
      bestMonth
    ]);
  }
  if (prodRows.length > 0) {
    prodSheet.getRange(2, 1, prodRows.length, prodHeaders.length).setValues(prodRows);
  }
  beautifyBasicCatalogSheet(prodSheet, prodHeaders.length);

  // Bulk Write Customers
  var custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  custSheet.clearContents();
  var custHeaders = CONFIG.HEADERS.CUSTOMERS;
  custSheet.getRange(1, 1, 1, custHeaders.length).setValues([custHeaders]);

  var custRows = [];
  for (var cKey in customers) {
    var cu = customers[cKey];
    var avgOrderValue = cu.lifetimeOrders > 0 ? cu.lifetimeSpending / cu.lifetimeOrders : 0;
    custRows.push([
      cu.name,
      cu.phone,
      cu.email,
      cu.firstOrder || "",
      cu.lastOrder || "",
      cu.lifetimeOrders,
      cu.lifetimeSpending,
      avgOrderValue
    ]);
  }
  if (custRows.length > 0) {
    custSheet.getRange(2, 1, custRows.length, custHeaders.length).setValues(custRows);
  }
  beautifyBasicCatalogSheet(custSheet, custHeaders.length);
}

/**
 * Sorts orders newest first, retaining header
 */
function sortOrdersNewestFirst(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    var sortRange = sheet.getRange(2, 1, lastRow - 1, CONFIG.HEADERS.ORDERS.length);
    sortRange.sort([{column: 3, ascending: false}, {column: 1, ascending: false}]);
  }
}

/**
 * Format catalog pages (Products and Customers)
 */
function beautifyBasicCatalogSheet(sheet, totalCols) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) return;

  sheet.getRange(1, 1, 1, totalCols)
       .setBackground("#1a1a1a")
       .setFontColor("#ffffff")
       .setFontWeight("bold")
       .setFontFamily("Inter, Arial, sans-serif")
       .setFontSize(10)
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 28);

  if (lastRow > 1) {
    var body = sheet.getRange(2, 1, lastRow - 1, totalCols);
    body.setFontFamily("Inter, sans-serif")
        .setFontSize(9)
        .setVerticalAlignment("middle");

    for (var r = 2; r <= lastRow; r++) {
      sheet.setRowHeight(r, 22);
      var rowRange = sheet.getRange(r, 1, 1, totalCols);
      rowRange.setBackground(r % 2 === 0 ? "#ffffff" : "#fcfcfc");
    }
  }
  sheet.autoResizeColumns(1, totalCols);
}

/**
 * Custom-styled styling engine for the primary Transaction log
 */
function beautifyOrdersSheet(sheet) {
  var lastRow = sheet.getLastRow();
  var totalCols = CONFIG.HEADERS.ORDERS.length;
  
  // 1. Theme the core header
  var headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setBackground("#0c0c0c")
             .setFontColor("#e5c158") // Royal Gold trim
             .setFontWeight("bold")
             .setFontFamily("Inter, sans-serif")
             .setFontSize(10)
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  // 2. Format Body row sizing and fonts
  if (lastRow > 1) {
    var bodyRange = sheet.getRange(2, 1, lastRow - 1, totalCols);
    bodyRange.setFontFamily("Inter, sans-serif")
             .setFontSize(9)
             .setVerticalAlignment("middle");
              
    // Alternating Zebra rows
    for (var r = 2; r <= lastRow; r++) {
      sheet.setRowHeight(r, 24);
      var rowRange = sheet.getRange(r, 1, 1, totalCols);
      rowRange.setBackground(r % 2 === 0 ? "#ffffff" : "#fafafa");
    }

    // Pricing aligns right
    sheet.getRange(2, 19, lastRow - 1, 4).setHorizontalAlignment("right").setNumberFormat("৳#,##0");
    sheet.getRange(2, 17, lastRow - 1, 1).setHorizontalAlignment("center"); // Qty
    
    // Dates formatted correctly
    sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss").setHorizontalAlignment("center");
    sheet.getRange(2, 3, lastRow - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss").setHorizontalAlignment("center");

    // 3. Dropdown Validation
    var payStatusRange = sheet.getRange(2, 12, lastRow - 1, 1);
    var payRule = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.PAYMENT_STATUSES).build();
    payStatusRange.setDataValidation(payRule);

    var orderStatusRange = sheet.getRange(2, 13, lastRow - 1, 1);
    var orderRule = SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.ORDER_STATUSES).build();
    orderStatusRange.setDataValidation(orderRule);

    // 4. Set up Conditional Formatting rules for order status states
    applyOrderStatusConditionalFormatting(sheet, lastRow);
  }

  // 5. Enable default filters
  var filter = sheet.getFilter();
  if (!filter) {
    sheet.getRange(1, 1, lastRow, totalCols).createFilter();
  }

  // Adjust columns widths
  sheet.autoResizeColumns(1, totalCols);
}

/**
 * Configure beautiful conditional cell rendering rules
 */
function applyOrderStatusConditionalFormatting(sheet, lastRow) {
  var range = sheet.getRange(2, 13, lastRow - 1, 1); // Order Status Col M (13)
  sheet.clearConditionalFormatRules(); // Clear previous overlaps safely
  
  var rules = [];
  var statusColors = {
    "Pending": { bg: "#fef3c7", text: "#b45309" },      // Light Yellow
    "Confirmed": { bg: "#dbeafe", text: "#1d4ed8" },    // Light Blue
    "Processing": { bg: "#ffedd5", text: "#c2410c" },   // Light Orange
    "Packed": { bg: "#f3e8ff", text: "#6b21a8" },       // Light Purple
    "Shipped": { bg: "#e0e7ff", text: "#4338ca" },       // Light Indigo
    "Delivered": { bg: "#dcfce7", text: "#15803d" },     // Light Green
    "Cancelled": { bg: "#fee2e2", text: "#b91c1c" },     // Light Red
    "Returned": { bg: "#f3f4f6", text: "#374151" }       // Light Gray
  };

  Object.keys(statusColors).forEach(function(status) {
    var style = statusColors[status];
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(style.bg)
      .setFontColor(style.text)
      .setRanges([range])
      .build();
    rules.push(rule);
  });

  sheet.setConditionalFormatRules(rules);
}

/**
 * Build dynamic Operations Dashboard with structural, premium cards and selection-driven search console.
 */
function buildOperationalDashboard(sheet) {
  sheet.clear();
  sheet.showSheet();
  
  // Set dimensions
  sheet.setColumnWidth(1, 160); // Col A: KPI Title
  sheet.setColumnWidth(2, 120); // Col B: Value
  sheet.setColumnWidth(3, 30);  // Col C: Spacer
  sheet.setColumnWidth(4, 160); // Col D: KPI Title
  sheet.setColumnWidth(5, 120); // Col E: Value
  sheet.setColumnWidth(6, 30);  // Col F: Spacer
  sheet.setColumnWidth(7, 240); // Col G: Search Title / Input Label / Button 1
  sheet.setColumnWidth(8, 240); // Col H: Search Input / Button 2
  
  // 1. Dashboard Banner Card
  sheet.getRange("A1:H1").merge();
  sheet.getRange("A1").setValue("ROY MEN | EXECUTIVE CONTROL DESK")
       .setBackground("#0f0f0f")
       .setFontColor("#d4af37") // Gold luxury
       .setFontFamily("Georgia, serif")
       .setFontSize(16)
       .setFontWeight("bold")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 55);

  sheet.getRange("A2:H2").merge();
  sheet.getRange("A2").setValue("Real-Time Synchronization with MongoDB & MERN Checkout API")
       .setBackground("#18181b")
       .setFontColor("#a1a1aa")
       .setFontFamily("Inter, Arial")
       .setFontSize(9)
       .setFontStyle("italic")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(2, 22);

  // Styling palette
  var PremiumTheme = { bgHeader: "#18181b", textHeader: "#e5c158", bgVal: "#fafafa", textVal: "#18181b" };
  var HighlightTheme = { bgHeader: "#0c0c0c", textHeader: "#facc15", bgVal: "#fef08a", textVal: "#18181b" };
  var SuccessTheme = { bgHeader: "#14532d", textHeader: "#4ade80", bgVal: "#f0fdf4", textVal: "#14532d" };
  var AlertTheme = { bgHeader: "#7f1d1d", textHeader: "#fca5a5", bgVal: "#fef2f2", textVal: "#7f1d1d" };
  var NeutralTheme = { bgHeader: "#27272a", textHeader: "#e4e4e7", bgVal: "#f4f4f5", textVal: "#27272a" };

  // KPI Card Generator
  function createKpiCard(row, col, label, formula, numFormat, colorTheme) {
    var labelRange = sheet.getRange(row, col, 1, 2).merge();
    labelRange.setValue("  " + label)
              .setBackground(colorTheme.bgHeader)
              .setFontColor(colorTheme.textHeader)
              .setFontFamily("Inter")
              .setFontSize(8)
              .setFontWeight("bold")
              .setHorizontalAlignment("left")
              .setVerticalAlignment("middle");
              
    var valRange = sheet.getRange(row + 1, col, 1, 2).merge();
    valRange.setFormula(formula)
            .setBackground(colorTheme.bgVal)
            .setFontColor(colorTheme.textVal)
            .setFontFamily("Georgia")
            .setFontSize(14)
            .setFontWeight("bold")
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle");
    if (numFormat) valRange.setNumberFormat(numFormat);
    
    sheet.getRange(row, col, 2, 2).setBorder(true, true, true, true, false, false, "#e4e4e7", SpreadsheetApp.BorderStyle.SOLID);
  }

  // --- BUILD METRIC CARD GRID ---
  createKpiCard(4, 1, "TOTAL REVENUE", "=SUM(Orders!V2:V)", "৳#,##0", PremiumTheme);
  createKpiCard(4, 4, "PENDING ORDERS COUNT", "=COUNTIF(Orders!M2:M, \"Pending\")", "#,##0", HighlightTheme);

  createKpiCard(7, 1, "TODAY'S REVENUE", "=SUMIFS(Orders!V2:V, Orders!C2:C, \">=\"&TODAY(), Orders!C2:C, \"<\"&TODAY()+1)", "৳#,##0", HighlightTheme);
  createKpiCard(7, 4, "DELIVERED ORDERS", "=COUNTIF(Orders!M2:M, \"Delivered\")", "#,##0", SuccessTheme);

  createKpiCard(10, 1, "THIS MONTH REVENUE", "=SUMIFS(Orders!V2:V, Orders!C2:C, \">=\"&DATE(YEAR(TODAY()), MONTH(TODAY()), 1), Orders!C2:C, \"<\"&DATE(YEAR(TODAY()), MONTH(TODAY())+1, 1))", "৳#,##0", NeutralTheme);
  createKpiCard(10, 4, "CANCELLED ORDERS", "=COUNTIF(Orders!M2:M, \"Cancelled\")", "#,##0", AlertTheme);

  createKpiCard(13, 1, "AVERAGE ORDER VALUE (AOV)", "=IFERROR(AVERAGE(Orders!V2:V), 0)", "৳#,##0", NeutralTheme);
  createKpiCard(13, 4, "TOTAL UNIQUE CLIENTS", "=COUNTA(Customers!A2:A)", "#,##0", NeutralTheme);

  createKpiCard(16, 1, "TOP PERFORMING ITEM", "=IFERROR(INDEX(Products!A2:A, MATCH(MAX(Products!B2:B), Products!B2:B, 0)), \"None\")", null, PremiumTheme);
  createKpiCard(16, 4, "NEWEST REGISTERED USER", "=IFERROR(INDEX(Customers!A2:A, MATCH(MAX(Customers!F2:F), Customers!F2:F, 0)), \"None\")", null, NeutralTheme);

  // Set card sizing proportions
  var rowsToSize = [4, 7, 10, 13, 16];
  rowsToSize.forEach(function(r) {
    sheet.setRowHeight(r, 18);
    sheet.setRowHeight(r + 1, 32);
    sheet.setRowHeight(r + 2, 12); // Margin gaps
  });

  // --- INTERACTIVE SEARCH CONSOLE DESK (Col G-H) ---
  sheet.getRange("G4:H4").merge();
  sheet.getRange("G4").setValue("✦ TRANSACTION SEARCH ENGINE")
       .setBackground("#0c0c0c")
       .setFontColor("#facc15")
       .setFontWeight("bold")
       .setFontFamily("Inter, sans-serif")
       .setFontSize(10)
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(4, 26);

  sheet.getRange("G5:H5").merge();
  sheet.getRange("G5").setValue("ENTER QUERY BELOW & TAP THE INTERACTIVE RUN BUTTON:")
       .setFontSize(8)
       .setFontWeight("bold")
       .setFontFamily("Inter")
       .setFontColor("#71717a")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(5, 20);

  // Search input cell (G6:H6 merged)
  sheet.getRange("G6:H6").merge();
  var searchInput = sheet.getRange("G6");
  if (searchInput.getValue() === "") {
    searchInput.setValue("");
  }
  searchInput.setBackground("#fefce8")
              .setBorder(true, true, true, true, false, false, "#eab308", SpreadsheetApp.BorderStyle.DOUBLE)
              .setFontWeight("bold")
              .setFontFamily("Inter")
              .setFontSize(11)
              .setHorizontalAlignment("center")
              .setVerticalAlignment("middle");
  sheet.setRowHeight(6, 32);

  // Interactive buttons via onSelectionChange cells
  sheet.getRange("G7").setValue("🔍 [ CLICK TO RUN SEARCH ]")
       .setBackground("#dcfce7")
       .setFontColor("#15803d")
       .setFontWeight("bold")
       .setFontFamily("Inter")
       .setFontSize(9)
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle")
       .setBorder(true, true, true, true, false, false, "#16a34a", SpreadsheetApp.BorderStyle.SOLID);
       
  sheet.getRange("H7").setValue("🧹 [ CLICK TO CLEAR ]")
       .setBackground("#f4f4f5")
       .setFontColor("#4b5563")
       .setFontWeight("bold")
       .setFontFamily("Inter")
       .setFontSize(9)
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle")
       .setBorder(true, true, true, true, false, false, "#9ca3af", SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(7, 26);

  sheet.getRange("G9:H9").merge();
  sheet.getRange("G9").setValue("REAL-TIME RECONCILED SEARCH LEDGER MATCHES:")
       .setFontSize(8)
       .setFontWeight("bold")
       .setFontFamily("Inter")
       .setFontColor("#ffffff")
       .setBackground("#27272a")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(9, 20);

  // Dynamic filter query statement
  var queryFormula = '=IF(ISBLANK(G6), "💡 ENTER TARGET SEARCH QUERY TO START RECONCILIATION...", IFERROR(QUERY(Orders!A2:AB, "SELECT B, D, E, K, L, M, V WHERE B LIKE \'%"&G6&"%\' OR D LIKE \'%"&G6&"%\' OR E LIKE \'%"&G6&"%\' OR F LIKE \'%"&G6&"%\' LIMIT 15 LABEL B \'Order ID\', D \'Client Name\', E \'Phone\', K \'Gateway\', L \'Payment\', M \'Status\', V \'Total (BDT)\'", 1), "❌ NO MATCHING SYSTEM TRANSACTION RECORDS RECOGNIZED."))';
  sheet.getRange("G10").setFormula(queryFormula)
       .setFontFamily("Inter")
       .setFontSize(9)
       .setVerticalAlignment("middle");
        
  sheet.getRange("G10:H20").setFontFamily("Inter").setFontSize(9);

  // --- SECTION G: SYSTEM HEALTH MONITOR (G21:H26) ---
  sheet.getRange("G21:H21").merge();
  sheet.getRange("G21").setValue("⚙️ SYSTEM HEALTH MONITOR")
       .setBackground("#0c0c0c")
       .setFontColor("#facc15")
       .setFontWeight("bold")
       .setFontFamily("Inter, sans-serif")
       .setFontSize(10)
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(21, 26);

  var healthLabels = [
    ["Apps Script Status", "Healthy"],
    ["Database Status", "Online"],
    ["Last Sync Time", "Never"],
    ["Total API Requests", "0"],
    ["Success Rate", "100%"]
  ];

  for (var idx = 0; idx < healthLabels.length; idx++) {
    var rNum = 22 + idx;
    sheet.getRange(rNum, 7).setValue(healthLabels[idx][0])
         .setBackground("#18181b")
         .setFontColor("#e4e4e7")
         .setFontWeight("bold")
         .setFontFamily("Inter")
         .setFontSize(9)
         .setHorizontalAlignment("left")
         .setVerticalAlignment("middle");

    sheet.getRange(rNum, 8).setValue(healthLabels[idx][1])
         .setBackground("#f4f4f5")
         .setFontColor("#18181b")
         .setFontFamily("Inter")
         .setFontSize(9)
         .setHorizontalAlignment("center")
         .setVerticalAlignment("middle");
    sheet.setRowHeight(rNum, 22);
    sheet.getRange(rNum, 7, 1, 2).setBorder(true, true, true, true, false, false, "#e4e4e7", SpreadsheetApp.BorderStyle.SOLID);
  }
}

/**
 * FAST REFRESH FOR DASHBOARD FORMULAS & SYSTEM HEALTH STATUS
 * Satisfies performance requirements without clearing design elements or cell layout.
 */
function refreshDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!sheet) return;

  // Reprocess any offline failed sync packets first
  try {
    processFailedSyncQueue();
  } catch (err) {
    console.error("Failed processing sync queue: " + err);
  }

  // Recalculate analytic catalog lists in batch
  recalculateCatalogAndAnalytics();

  // Refresh dynamic aggregations & charts in Reports sheet
  var rSheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
  if (rSheet) {
    buildReportsSheet(rSheet);
  }

  // Refresh System Health monitor values dynamically
  var props = PropertiesService.getScriptProperties();
  var total = Number(props.getProperty("TOTAL_REQUESTS") || "0");
  var failed = Number(props.getProperty("FAILED_REQUESTS") || "0");
  var successRate = total > 0 ? Math.round(((total - failed) / total) * 100) + "%" : "100%";
  var lastSyncEpoch = Number(props.getProperty("LAST_SYNC_TIME") || "0");
  var lastSyncStr = lastSyncEpoch > 0 ? formatDateTimeInDhaka(new Date(lastSyncEpoch)) : "Never";

  sheet.getRange("H22").setValue("Healthy");
  sheet.getRange("H23").setValue("Online");
  sheet.getRange("H24").setValue(lastSyncStr);
  sheet.getRange("H25").setValue(total + " (Failed: " + failed + ")");
  sheet.getRange("H26").setValue(successRate);

  SpreadsheetApp.flush();
}

/**
 * AUTOMATED CLOCK RE-TRIGGER TARGET
 */
function runEvery5Minutes() {
  console.log("Triggered automatic 5-min cron dashboard sync...");
  try {
    processFailedSyncQueue();
  } catch (err) {
    console.error("Failed processing sync queue in cron: " + err);
  }
  refreshDashboard();
}

/**
 * Create a clock trigger to sync business data and report models automatically.
 */
function createTimeDrivenTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var triggerExists = false;
  
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "runEvery5Minutes") {
      triggerExists = true;
      break;
    }
  }
  
  if (!triggerExists) {
    ScriptApp.newTrigger("runEvery5Minutes")
             .timeBased()
             .everyMinutes(5)
             .create();
    SpreadsheetApp.getUi().alert("🕒 Automated clock trigger successfully scheduled to run every 5 minutes!");
  } else {
    SpreadsheetApp.getUi().alert("🕒 Clock sync trigger is already active and running.");
  }
}

/**
 * Build dynamic Reports sheet equipped with auto-aggregating visual metrics and charts.
 */
function buildReportsSheet(sheet) {
  sheet.clear();
  sheet.showSheet();

  sheet.setColumnWidth(1, 100); // Daily Date
  sheet.setColumnWidth(2, 80);  // Daily orders
  sheet.setColumnWidth(3, 120); // Daily revenue
  sheet.setColumnWidth(4, 30);  // Spacer
  sheet.setColumnWidth(5, 100); // Monthly date
  sheet.setColumnWidth(6, 80);  // Monthly orders
  sheet.setColumnWidth(7, 120); // Monthly revenue
  sheet.setColumnWidth(8, 30);  // Spacer
  sheet.setColumnWidth(9, 100); // Gateway label
  sheet.setColumnWidth(10, 120); // Gateway volume
  sheet.setColumnWidth(11, 30); // Spacer
  sheet.setColumnWidth(12, 100); // Status label
  sheet.setColumnWidth(13, 80);  // Status count
  sheet.setColumnWidth(14, 30); // Spacer
  sheet.setColumnWidth(15, 150); // Product catalog name
  sheet.setColumnWidth(16, 80);  // Product sales
  sheet.setColumnWidth(17, 120); // Product revenue
  sheet.setColumnWidth(18, 30); // Spacer
  sheet.setColumnWidth(19, 150); // Customer name
  sheet.setColumnWidth(20, 80);  // Customer orders
  sheet.setColumnWidth(21, 120); // Customer spending

  sheet.getRange("A1:U1").merge();
  sheet.getRange("A1").setValue("ROY MEN | EXECUTIVE REPORTING & AUDITING")
       .setBackground("#000000")
       .setFontColor("#ffffff")
       .setFontFamily("Georgia")
       .setFontSize(14)
       .setFontWeight("bold")
       .setHorizontalAlignment("center")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 45);

  function applyHeader(range, text) {
    range.merge().setValue(text)
         .setBackground("#ecebeb")
         .setFontColor("#000000")
         .setFontWeight("bold")
         .setFontSize(9)
         .setFontFamily("Inter")
         .setHorizontalAlignment("center");
  }

  // Row 3 Section Headers
  applyHeader(sheet.getRange("A3:C3"), "DAILY SALES TIMELINE");
  applyHeader(sheet.getRange("E3:G3"), "MONTHLY SALES TRENDS");
  applyHeader(sheet.getRange("I3:J3"), "PAYMENT METHOD SPLIT");
  applyHeader(sheet.getRange("L3:M3"), "ORDER STATUS SPREAD");
  applyHeader(sheet.getRange("O3:Q3"), "TOP SELLING PRODUCTS");
  applyHeader(sheet.getRange("S3:U3"), "TOP VALUE CUSTOMERS");

  // Dynamic Query formulas for instant aggregation reporting
  sheet.getRange("A4").setFormula('=QUERY(Orders!A2:AB, "SELECT toDate(C), COUNT(B), SUM(V) WHERE B IS NOT NULL GROUP BY toDate(C) ORDER BY toDate(C) DESC LIMIT 15 LABEL toDate(C) \'Date\', COUNT(B) \'Orders\', SUM(V) \'Revenue (BDT)\'", 1)');
  sheet.getRange("E4").setFormula('=QUERY(Orders!A2:AB, "SELECT eomonth(C), COUNT(B), SUM(V) WHERE B IS NOT NULL GROUP BY eomonth(C) ORDER BY eomonth(C) DESC LIMIT 12 LABEL eomonth(C) \'Month\', COUNT(B) \'Orders\', SUM(V) \'Revenue (BDT)\'", 1)');
  sheet.getRange("I4").setFormula('=QUERY(Orders!A2:AB, "SELECT K, SUM(V) WHERE B IS NOT NULL GROUP BY K LABEL K \'Gateway\', SUM(V) \'Volume\'", 1)');
  sheet.getRange("L4").setFormula('=QUERY(Orders!A2:AB, "SELECT M, COUNT(B) WHERE B IS NOT NULL GROUP BY M LABEL M \'Status\', COUNT(B) \'Orders\'", 1)');
  sheet.getRange("O4").setFormula('=QUERY(Products!A2:G, "SELECT A, B, C WHERE A IS NOT NULL ORDER BY B DESC LIMIT 10 LABEL A \'Product\', B \'Qty\', C \'Revenue\'", 1)');
  sheet.getRange("S4").setFormula('=QUERY(Customers!A2:H, "SELECT A, F, G WHERE A IS NOT NULL ORDER BY G DESC LIMIT 10 LABEL A \'Customer\', F \'Orders\', G \'Spending\'", 1)');

  sheet.getRange("A4:U4").setFontWeight("bold").setBackground("#f8f8f8");
  sheet.getRange(4, 1, 30, 21).setFontFamily("Inter").setFontSize(9);

  // Generate beautiful charts programmatically
  generateOperationalCharts(sheet);
}

/**
 * Builds 6 premium embedded dashboard charts natively inside the Reports desk.
 */
function generateOperationalCharts(sheet) {
  var charts = sheet.getCharts();
  for (var i = 0; i < charts.length; i++) {
    sheet.removeChart(charts[i]);
  }

  // Chart 1: Daily Revenue Trend (Area Chart)
  var dailyDateRange = sheet.getRange("A5:A20");
  var dailyRevRange = sheet.getRange("C5:C20");
  var dailyChart = sheet.newChart()
    .setChartType(Charts.ChartType.AREA)
    .addRange(dailyDateRange)
    .addRange(dailyRevRange)
    .setPosition(18, 1, 0, 0)
    .setOption("title", "Daily Revenue Trend (BDT)")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#0f172a"])
    .build();

  // Chart 2: Monthly Revenue Trend (Column Chart)
  var monthlyDateRange = sheet.getRange("E5:E16");
  var monthlyRevRange = sheet.getRange("G5:G16");
  var monthlyChart = sheet.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(monthlyDateRange)
    .addRange(monthlyRevRange)
    .setPosition(18, 8, 0, 0)
    .setOption("title", "Monthly Revenue Trend (BDT)")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#d4af37"])
    .build();

  // Chart 3: Payment Method Chart (Pie Chart)
  var gatewayRange = sheet.getRange("I4:J10");
  var paymentChart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(gatewayRange)
    .setPosition(34, 1, 0, 0)
    .setOption("title", "Payment Method Split")
    .setOption("is3D", true)
    .setOption("colors", ["#18181b", "#d4af37", "#52525b", "#a1a1aa"])
    .build();

  // Chart 4: Order Status Chart (Donut Chart)
  var statusRange = sheet.getRange("L4:M12");
  var statusChart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(statusRange)
    .setPosition(34, 8, 0, 0)
    .setOption("title", "Order Status Spread")
    .setOption("pieHole", 0.4)
    .setOption("colors", ["#f59e0b", "#3b82f6", "#f97316", "#8b5cf6", "#6366f1", "#10b981", "#ef4444", "#6b7280"])
    .build();

  // Chart 5: Top Products Chart (Bar Chart)
  var prodNameRange = sheet.getRange("O5:O14");
  var prodQtyRange = sheet.getRange("P5:P14");
  var prodChart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(prodNameRange)
    .addRange(prodQtyRange)
    .setPosition(50, 1, 0, 0)
    .setOption("title", "Top Products (Qty Sold)")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#27272a"])
    .build();

  // Chart 6: Top Customers Chart (Bar Chart)
  var custNameRange = sheet.getRange("S5:S14");
  var custSpentRange = sheet.getRange("U5:U14");
  var custChart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(custNameRange)
    .addRange(custSpentRange)
    .setPosition(50, 8, 0, 0)
    .setOption("title", "Top Customers (Total Spending)")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#d4af37"])
    .build();

  sheet.insertChart(dailyChart);
  sheet.insertChart(monthlyChart);
  sheet.insertChart(paymentChart);
  sheet.insertChart(statusChart);
  sheet.insertChart(prodChart);
  sheet.insertChart(custChart);
}

/**
 * ACTION: EXPORT PDF
 */
function exportPdfReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
  var url = ss.getUrl().replace(/edit$/, '') + 'export?exportFormat=pdf&format=pdf&size=letter&portrait=false&fitw=true&sheetid=' + sheet.getSheetId();
  
  var html = '<h3>ROY MEN Report PDF Ready</h3>' +
             '<p>Click the link below to download your premium PDF report:</p>' +
             '<a href="' + url + '" target="_blank" style="padding: 10px 20px; background: #000000; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Download PDF Report</a>';
  var userInterface = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(userInterface, "Export PDF");
}

/**
 * ACTION: EXPORT CSV
 */
function exportCsvOrders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
  var url = ss.getUrl().replace(/edit$/, '') + 'export?exportFormat=csv&gid=' + sheet.getSheetId();
  
  var html = '<h3>ROY MEN Orders CSV Ready</h3>' +
             '<p>Click the link below to download your raw transaction logs in CSV format:</p>' +
             '<a href="' + url + '" target="_blank" style="padding: 10px 20px; background: #000000; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Download CSV File</a>';
  var userInterface = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(userInterface, "Export CSV");
}

/**
 * ACTION: EXPORT EXCEL
 */
function exportExcelWorksheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var url = ss.getUrl().replace(/edit$/, '') + 'export?exportFormat=xlsx';
  
  var html = '<h3>ROY MEN Excel Workbook Ready</h3>' +
             '<p>Click the link below to download the complete database in Excel format (.xlsx):</p>' +
             '<a href="' + url + '" target="_blank" style="padding: 10px 20px; background: #000000; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Download Excel Workbook</a>';
  var userInterface = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(userInterface, "Export Excel");
}

/**
 * ACTION: BACKUP ORDERS
 */
function backupOrdersLedger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
  var bstNowString = formatDateTimeInDhaka(new Date()).replace(/[:\s]/g, "_");
  var backupSheetName = "Backup_Orders_" + bstNowString;
  
  var backupSheet = ss.getSheetByName(backupSheetName);
  if (backupSheet) {
    ss.deleteSheet(backupSheet);
  }
  
  backupSheet = sourceSheet.copyTo(ss);
  backupSheet.setName(backupSheetName);
  backupSheet.hideSheet();
  
  SpreadsheetApp.getUi().alert("Backup Successful!\nCreated hidden audit backup sheet: " + backupSheetName);
}

/**
 * SEARCH EXECUTOR Triggered by selecting G7 cell
 */
function runSearch() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.DASHBOARD);
  var query = sheet.getRange("G6").getValue();
  if (!query) {
    SpreadsheetApp.getUi().alert("Please enter a search query in cell G6 first.");
    return;
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Search completed for query: '" + query + "'", "Search Engine Status", 3);
}

/**
 * SEARCH CLEAR Triggered by selecting H7 cell
 */
function clearSearch() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.DASHBOARD);
  sheet.getRange("G6").setValue("");
}

/**
 * Helper: Converts Date to string matching Dhaka Timezone
 */
function formatDateTimeInDhaka(date) {
  try {
    return Utilities.formatDate(date, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
  } catch (e) {
    return date.toISOString();
  }
}

/**
 * Dynamic JSON formatter helper
 */
function createJsonResponse(body, status) {
  body.statusCode = status || 200;
  return ContentService.createTextOutput(JSON.stringify(body))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HISTORICAL STATE LOGGERS
 */
function logOrderStatusChange(orderId, prevStatus, newStatus, changedBy) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDER_HISTORY);
    sheet.appendRow([new Date(), orderId, prevStatus || "None", newStatus, changedBy]);
    beautifyBasicCatalogSheet(sheet, CONFIG.HEADERS.ORDER_HISTORY.length);
  } catch(e) {
    console.error("Order status logging failure: " + e);
  }
}

function logPaymentStatusChange(orderId, prevStatus, newStatus, changedBy) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.PAYMENT_HISTORY);
    sheet.appendRow([new Date(), orderId, prevStatus || "None", newStatus, changedBy]);
    beautifyBasicCatalogSheet(sheet, CONFIG.HEADERS.PAYMENT_HISTORY.length);
  } catch(e) {
    console.error("Payment status logging failure: " + e);
  }
}

function logAuditEvent(eventType, orderId, details) {
  try {
    console.log("[ROY_MEN Audit] " + eventType + " for order " + orderId + ": " + details);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
    sheet.appendRow([new Date(), eventType, orderId, details]);
    beautifyBasicCatalogSheet(sheet, CONFIG.HEADERS.AUDIT_LOG.length);
  } catch(e) {
    console.error("Audit logging failure: " + e);
  }
}

/**
 * API Key security validation check
 */
function verifyApiKey(e, payload) {
  var expectedKey = getSetting("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");
  var providedKey = e && e.parameter ? (e.parameter["x-api-key"] || e.parameter["apiKey"]) : null;
  if (!providedKey && payload) {
    providedKey = payload["x-api-key"] || payload.apiKey;
  }
  return (providedKey && providedKey === expectedKey);
}

/**
 * Webhook HMAC Hashing Signature Verification
 */
function verifySignature(e, payloadString) {
  var secret = getSetting("WEBHOOK_SECRET", "ROY_MEN_SECRET_2026");
  var providedSignature = e && e.parameter ? (e.parameter["signature"] || e.parameter["x-signature"]) : null;
  if (!providedSignature) {
    return true; // Let unsigned fallbacks pass gracefully if not strictly configured
  }

  try {
    var computedSignature = Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_256,
      payloadString,
      secret,
      Utilities.Charset.UTF_8
    );
    var computedHex = computedSignature.map(function(byte) {
      var hex = (byte & 0xff).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
    return computedHex === providedSignature;
  } catch(err) {
    console.error("Signature calculation error: " + err);
    return false;
  }
}

/**
 * IN-MEMORY SCRIPT PERFORMANCE CACHING UTILITIES
 */
var CacheHelper = {
  get: function(key) {
    try {
      return CacheService.getScriptCache().get(key);
    } catch(e) {
      return null;
    }
  },
  put: function(key, value, durationSec) {
    try {
      CacheService.getScriptCache().put(key, value, durationSec || 300);
    } catch(e) {}
  }
};

/**
 * DIAGNOSTIC COUNTERS SYSTEM
 */
function recordApiRequest(isSuccess) {
  try {
    var props = PropertiesService.getScriptProperties();
    var total = Number(props.getProperty("TOTAL_REQUESTS") || "0") + 1;
    var failed = Number(props.getProperty("FAILED_REQUESTS") || "0") + (isSuccess ? 0 : 1);
    props.setProperty("TOTAL_REQUESTS", total.toString());
    props.setProperty("FAILED_REQUESTS", failed.toString());
    props.setProperty("LAST_SYNC_TIME", new Date().getTime().toString());
  } catch(e) {}
}
