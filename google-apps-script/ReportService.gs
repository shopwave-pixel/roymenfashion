/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: ReportService.gs
 * ROLE: Time-Series Reports Builder & Aggregated Sales Pivot
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var ReportService = {
  /**
   * Compiles and rebuilds the reports grid with monthly and daily aggregations.
   */
  generateReportLedger: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      var reportsSheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);

      if (!ordersSheet) return;
      if (!reportsSheet) {
        reportsSheet = ss.insertSheet(CONFIG.SHEETS.REPORTS);
      }

      var ordersData = ordersSheet.getDataRange().getValues();
      if (ordersData.length <= 1) return;

      var colOrderDate = 2;   // Col C
      var colGrandTotal = 21; // Col V
      var colStatus = 12;     // Col M

      var monthlyAggregation = {};
      var totalRevenue = 0;
      var activeOrdersCount = 0;

      for (var i = 1; i < ordersData.length; i++) {
        var row = ordersData[i];
        var orderStatus = row[colStatus] ? row[colStatus].toString().trim() : "Pending";
        if (orderStatus === "Cancelled" || orderStatus === "Returned") continue;

        var amount = Number(row[colGrandTotal]) || 0;
        var dateVal = row[colOrderDate];

        var orderDate = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
        if (isNaN(orderDate.getTime())) continue;

        var monthKey = Utils.formatDateTimeInDhaka(orderDate).substring(0, 7); // "YYYY-MM"

        if (!monthlyAggregation[monthKey]) {
          monthlyAggregation[monthKey] = {
            revenue: amount,
            volume: 1
          };
        } else {
          monthlyAggregation[monthKey].revenue += amount;
          monthlyAggregation[monthKey].volume += 1;
        }

        totalRevenue += amount;
        activeOrdersCount += 1;
      }

      // Convert map to sorting matrix
      var writeBuffer = [];
      for (var key in monthlyAggregation) {
        writeBuffer.push([
          key,
          monthlyAggregation[key].volume,
          Math.round(monthlyAggregation[key].revenue)
        ]);
      }

      // Sort by Year-Month Chronologically ascending
      writeBuffer.sort(function(a, b) {
        return a[0].localeCompare(b[0]);
      });

      // Layout report grids
      reportsSheet.clear();
      reportsSheet.setGridlines(false);

      // Title header
      reportsSheet.getRange("A1:C1").merge()
        .setValue("MONTHLY SALES & REVENUE REPORT")
        .setFontFamily("Inter")
        .setFontSize(13)
        .setFontWeight("bold")
        .setFontColor(CONFIG.THEME.TEXT_LIGHT)
        .setBackground(CONFIG.THEME.PRIMARY_DARK)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      reportsSheet.getRange("A2:C2").merge()
        .setValue("CONFIRMED & FULLY SETTLED TRANSACTIONS ONLY")
        .setFontFamily("Inter")
        .setFontSize(8)
        .setFontColor(CONFIG.THEME.TEXT_MUTED)
        .setHorizontalAlignment("center");

      // Column Headers
      reportsSheet.getRange("A4:C4").setValues([["Year-Month", "Orders Volume", "Gross Revenue"]])
        .setFontFamily("Inter")
        .setFontSize(9)
        .setFontWeight("bold")
        .setBackground("#F0F0F0")
        .setBorder(true, true, true, true, null, null, CONFIG.THEME.PRIMARY_DARK, SpreadsheetApp.BorderStyle.SOLID);

      if (writeBuffer.length > 0) {
        reportsSheet.getRange(5, 1, writeBuffer.length, 3).setValues(writeBuffer)
          .setFontFamily("Inter")
          .setFontSize(9);
        
        var maxRow = writeBuffer.length + 4;
        reportsSheet.getRange(5, 3, writeBuffer.length, 1).setNumberFormat("৳#,##0"); // Format revenue
        Utils.applyZebraStriping(reportsSheet, 5, maxRow, 3);
        
        // Total summary row
        reportsSheet.getRange(maxRow + 1, 1).setValue("Total Aggregate").setFontWeight("bold");
        reportsSheet.getRange(maxRow + 1, 2).setValue("=SUM(B5:B" + maxRow + ")").setFontWeight("bold");
        reportsSheet.getRange(maxRow + 1, 3).setValue("=SUM(C5:C" + maxRow + ")")
          .setFontWeight("bold")
          .setNumberFormat("৳#,##0");
          
        reportsSheet.getRange(maxRow + 1, 1, 1, 3)
          .setBorder(true, null, true, null, null, null, CONFIG.THEME.PRIMARY_DARK, SpreadsheetApp.BorderStyle.DOUBLE);
      }

      reportsSheet.autoResizeColumns(1, 3);
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Historical reports compilation successfully updated.");
    } catch (e) {
      console.error("Reports aggregation error: " + e.toString());
    }
  }
};
