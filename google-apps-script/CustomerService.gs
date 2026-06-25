/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: CustomerService.gs
 * ROLE: In-Memory High Performance Customer Relationship Indexer
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var CustomerService = {
  /**
   * Recalculates and bulk syncs customer statistics from the primary Orders sheet.
   * Utilizes an in-memory aggregation map to support high transaction loads.
   */
  reindexAllCustomers: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      var customersSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
      
      if (!ordersSheet) return;
      if (!customersSheet) {
        customersSheet = ss.insertSheet(CONFIG.SHEETS.CUSTOMERS);
      }

      var ordersData = ordersSheet.getDataRange().getValues();
      if (ordersData.length <= 1) return; // No orders to calculate

      // Indexes based on headers
      var colCustomerName = 3;  // Col D (0-indexed)
      var colPhone = 4;         // Col E
      var colEmail = 5;         // Col F
      var colOrderDate = 2;     // Col C
      var colGrandTotal = 21;   // Col V

      // Aggregator dictionary utilizing composite indexing
      var customerMap = {};

      for (var i = 1; i < ordersData.length; i++) {
        var row = ordersData[i];
        var rawPhone = row[colPhone] ? row[colPhone].toString().trim() : "";
        if (!rawPhone) continue;

        var name = row[colCustomerName] || "Guest Customer";
        var email = row[colEmail] || "N/A";
        var dateVal = row[colOrderDate];
        var total = Number(row[colGrandTotal]) || 0;

        // Process Date objects safely
        var orderDate = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
        if (isNaN(orderDate.getTime())) orderDate = new Date();

        if (!customerMap[rawPhone]) {
          customerMap[rawPhone] = {
            name: name,
            phone: rawPhone,
            email: email,
            firstOrder: orderDate,
            lastOrder: orderDate,
            count: 1,
            spend: total
          };
        } else {
          var entry = customerMap[rawPhone];
          entry.count += 1;
          entry.spend += total;
          
          if (orderDate < entry.firstOrder) entry.firstOrder = orderDate;
          if (orderDate > entry.lastOrder) entry.lastOrder = orderDate;
          
          // Keep name/email updated with newest checkout profile data
          if (name !== "Guest Customer") entry.name = name;
          if (email !== "N/A") entry.email = email;
        }
      }

      // Convert aggregated hashmap into structured array list for sheet writing
      var writeBuffer = [];
      for (var key in customerMap) {
        var entry = customerMap[key];
        var aov = entry.count > 0 ? (entry.spend / entry.count) : 0;
        
        writeBuffer.push([
          entry.name,
          entry.phone,
          entry.email,
          Utils.formatDateTimeInDhaka(entry.firstOrder).substring(0, 10), // Only date part
          Utils.formatDateTimeInDhaka(entry.lastOrder).substring(0, 10),
          entry.count,
          Math.round(entry.spend),
          Math.round(aov)
        ]);
      }

      // Sort Customer ledger by total spend descending
      writeBuffer.sort(function(a, b) { return b[6] - a[6]; });

      // Clean sheet and perform high speed block write
      customersSheet.clear();
      customersSheet.appendRow(CONFIG.HEADERS.CUSTOMERS);
      
      if (writeBuffer.length > 0) {
        customersSheet.getRange(2, 1, writeBuffer.length, CONFIG.HEADERS.CUSTOMERS.length).setValues(writeBuffer);
        
        // Apply styling formats
        var maxRow = writeBuffer.length + 1;
        customersSheet.getRange(2, 7, writeBuffer.length, 2).setNumberFormat("৳#,##0"); // Spend & AOV (BD Currency formatting)
        Utils.applyZebraStriping(customersSheet, 2, maxRow, CONFIG.HEADERS.CUSTOMERS.length);
      }

      this.applyCustomerFormatting(customersSheet);
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Customer list aggregated and compiled. Indexed: " + writeBuffer.length + " clients.");

    } catch (e) {
      console.error("Critical customer indexing failed: " + e.toString());
      AuditService.log(CONFIG.LOGGING.LEVELS.ERROR, null, "Customer aggregation failed: " + e.toString());
    }
  },

  /**
   * Applies the Quiet Luxury style layout onto the compiled customer sheet.
   * @param {Sheet} sheet - Target customer sheet.
   */
  applyCustomerFormatting: function(sheet) {
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.CUSTOMERS.length)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold")
      .setFontFamily("Inter");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, CONFIG.HEADERS.CUSTOMERS.length);
  }
};
