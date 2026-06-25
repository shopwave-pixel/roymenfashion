/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: ProductService.gs
 * ROLE: Catalog Sales Aggregator & Performance Indexer
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var ProductService = {
  /**
   * Compiles individual sales statistics for every product item across the Orders sheet.
   * Gracefully parses complex comma-separated entries or multiple JSON arrays.
   */
  reindexAllProducts: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      var productsSheet = ss.getSheetByName(CONFIG.SHEETS.PRODUCTS);
      
      if (!ordersSheet) return;
      if (!productsSheet) {
        productsSheet = ss.insertSheet(CONFIG.SHEETS.PRODUCTS);
      }

      var ordersData = ordersSheet.getDataRange().getValues();
      if (ordersData.length <= 1) return;

      var colProducts = 13;     // Col N (0-indexed)
      var colQty = 16;          // Col Q
      var colUnitPrice = 17;    // Col R
      var colOrderDate = 2;     // Col C

      // In-memory catalog hash table
      var productMap = {};

      for (var i = 1; i < ordersData.length; i++) {
        var row = ordersData[i];
        var rawProducts = row[colProducts] ? row[colProducts].toString().trim() : "";
        if (!rawProducts) continue;

        var totalQty = Number(row[colQty]) || 1;
        var unitPrice = Number(row[colUnitPrice]) || 0;
        var dateVal = row[colOrderDate];

        var orderDate = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
        if (isNaN(orderDate.getTime())) orderDate = new Date();

        // Split items by comma or semicolon if multiple products are packed in one cell
        var items = rawProducts.split(/[,;\n]+/);
        var itemCount = items.length;
        
        // Distribute quantities and totals across split items (approximation or precise mapping)
        var splitQty = Math.max(1, Math.round(totalQty / itemCount));
        var revenueAllocation = (unitPrice * totalQty) / itemCount;

        for (var j = 0; j < items.length; j++) {
          var prodName = items[j].toString().trim();
          if (prodName === "") continue;

          var monthKey = Utils.formatDateTimeInDhaka(orderDate).substring(0, 7); // YYYY-MM

          if (!productMap[prodName]) {
            productMap[prodName] = {
              name: prodName,
              qty: splitQty,
              revenue: revenueAllocation,
              firstSold: orderDate,
              lastSold: orderDate,
              monthlySales: {}
            };
            productMap[prodName].monthlySales[monthKey] = splitQty;
          } else {
            var entry = productMap[prodName];
            entry.qty += splitQty;
            entry.revenue += revenueAllocation;
            
            if (orderDate < entry.firstSold) entry.firstSold = orderDate;
            if (orderDate > entry.lastSold) entry.lastSold = orderDate;
            
            if (!entry.monthlySales[monthKey]) {
              entry.monthlySales[monthKey] = splitQty;
            } else {
              entry.monthlySales[monthKey] += splitQty;
            }
          }
        }
      }

      // Format records for sheet insertion
      var writeBuffer = [];
      for (var name in productMap) {
        var entry = productMap[name];
        var asp = entry.qty > 0 ? (entry.revenue / entry.qty) : 0;
        
        // Determine peak sales volume month
        var peakMonth = "N/A";
        var maxMonthQty = -1;
        for (var m in entry.monthlySales) {
          if (entry.monthlySales[m] > maxMonthQty) {
            maxMonthQty = entry.monthlySales[m];
            peakMonth = m;
          }
        }

        writeBuffer.push([
          entry.name,
          entry.qty,
          Math.round(entry.revenue),
          Utils.formatDateTimeInDhaka(entry.firstSold).substring(0, 10),
          Utils.formatDateTimeInDhaka(entry.lastSold).substring(0, 10),
          Math.round(asp),
          peakMonth
        ]);
      }

      // Sort by total revenue descending
      writeBuffer.sort(function(a, b) { return b[2] - a[2]; });

      productsSheet.clear();
      productsSheet.appendRow(CONFIG.HEADERS.PRODUCTS);

      if (writeBuffer.length > 0) {
        productsSheet.getRange(2, 1, writeBuffer.length, CONFIG.HEADERS.PRODUCTS.length).setValues(writeBuffer);
        
        var maxRow = writeBuffer.length + 1;
        productsSheet.getRange(2, 3, writeBuffer.length, 1).setNumberFormat("৳#,##0"); // Revenue format
        productsSheet.getRange(2, 6, writeBuffer.length, 1).setNumberFormat("৳#,##0"); // ASP format
        Utils.applyZebraStriping(productsSheet, 2, maxRow, CONFIG.HEADERS.PRODUCTS.length);
      }

      this.applyProductFormatting(productsSheet);
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Catalog sales aggregated. Unique product lines indexed: " + writeBuffer.length);

    } catch (e) {
      console.error("Critical product indexing failed: " + e.toString());
      AuditService.log(CONFIG.LOGGING.LEVELS.ERROR, null, "Catalog sales calculations failed: " + e.toString());
    }
  },

  /**
   * Applies the Quiet Luxury layout theme onto the Products sheet.
   * @param {Sheet} sheet - Target product sheet.
   */
  applyProductFormatting: function(sheet) {
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.PRODUCTS.length)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold")
      .setFontFamily("Inter");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, CONFIG.HEADERS.PRODUCTS.length);
  }
};
