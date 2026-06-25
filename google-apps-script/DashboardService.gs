/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: DashboardService.gs
 * ROLE: Visual Grid Dashboard Layout Designer & Interactive KPI Console
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var DashboardService = {
  /**
   * Rebuilds the operational dashboard panel from the ground up.
   * Leverages precise cells formatting, bold text hierarchy, and negative borders.
   */
  initializeDashboard: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.DASHBOARD);
      }

      // De-clutter active viewport by hiding non-dashboard cells
      sheet.clear();
      sheet.getRange("A1:Z100").setBackground("#FFFFFF");
      sheet.showSheet();

      // Configure gridline visibility to represent editorial fashion card layout
      sheet.setGridlines(false);

      // Title Card
      var titleRange = sheet.getRange(CONFIG.DASHBOARD_COORDS.TITLE_RANGE);
      titleRange.merge()
        .setValue("ROY MEN")
        .setFontFamily("Inter")
        .setFontSize(22)
        .setFontWeight("bold")
        .setFontColor(CONFIG.THEME.PRIMARY_DARK)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      var subtitleRange = sheet.getRange(CONFIG.DASHBOARD_COORDS.SUBTITLE_RANGE);
      subtitleRange.merge()
        .setValue("ENTERPRISE ORDER RECONCILIATION & OPERATIONS")
        .setFontFamily("Inter")
        .setFontSize(9)
        .setFontWeight("normal")
        .setFontColor(CONFIG.THEME.ACCENT_GOLD)
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");

      // Draw subtle champagne divider bar under title
      var divider = sheet.getRange("A3:H3");
      divider.merge().setBackground(CONFIG.THEME.PRIMARY_DARK);

      // 1. Render Live KPI Blocks
      var kpis = CONFIG.DASHBOARD_COORDS.KPI_GRID;
      
      this.drawKpiBlock(sheet, kpis.REVENUE.LABEL, kpis.REVENUE.VALUE, "TOTAL REVENUE", kpis.REVENUE.FORMULA, "৳#,##0");
      this.drawKpiBlock(sheet, kpis.ORDERS.LABEL, kpis.ORDERS.VALUE, "TOTAL TRANSACTIONS", kpis.ORDERS.FORMULA, "#,##0");
      this.drawKpiBlock(sheet, kpis.CUSTOMERS.LABEL, kpis.CUSTOMERS.VALUE, "INDEXED CUSTOMERS", kpis.CUSTOMERS.FORMULA, "#,##0");
      this.drawKpiBlock(sheet, kpis.AOV.LABEL, kpis.AOV.VALUE, "AVERAGE ORDER VALUE", kpis.AOV.FORMULA, "৳#,##0");

      // 2. Render Interactive Search Console Block
      this.drawSearchConsole(sheet);

      // Column widths formatting
      sheet.setColumnWidth(1, 140); // Col A
      sheet.setColumnWidth(2, 140); // Col B
      sheet.setColumnWidth(3, 40);  // Spacer Col C
      sheet.setColumnWidth(4, 140); // Col D
      sheet.setColumnWidth(5, 140); // Col E
      sheet.setColumnWidth(6, 40);  // Spacer Col F
      sheet.setColumnWidth(7, 160); // Search Console Input
      sheet.setColumnWidth(8, 160); // Action Buttons

      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Operations dashboard console generated and formatted.");
    } catch (e) {
      console.error("Dashboard render exception: " + e.toString());
    }
  },

  /**
   * Helper to format a modular bento KPI block.
   */
  drawKpiBlock: function(sheet, labelRangeStr, valueRangeStr, title, formula, numberFormat) {
    var labelRange = sheet.getRange(labelRangeStr);
    labelRange.merge()
      .setValue(title)
      .setFontFamily("Inter")
      .setFontSize(8)
      .setFontWeight("bold")
      .setFontColor(CONFIG.THEME.TEXT_MUTED)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#FAFAFA");

    var valueRange = sheet.getRange(valueRangeStr);
    valueRange.merge()
      .setValue(formula)
      .setFontFamily("Inter")
      .setFontSize(16)
      .setFontWeight("bold")
      .setFontColor(CONFIG.THEME.PRIMARY_DARK)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground("#FAFAFA")
      .setNumberFormat(numberFormat);

    // Apply clean luxury border borders
    var fullBlock = sheet.getRange(labelRange.getRow(), labelRange.getColumn(), 2, labelRange.getNumColumns());
    fullBlock.setBorder(true, true, true, true, null, null, CONFIG.THEME.BORDER_LIGHT, SpreadsheetApp.BorderStyle.SOLID);
  },

  /**
   * Draws the interactive search console.
   */
  drawSearchConsole: function(sheet) {
    // Console Card Header
    sheet.getRange("G4:H4").merge()
      .setValue("VIP CLIENT SEARCH CONSOLE")
      .setFontFamily("Inter")
      .setFontSize(8)
      .setFontWeight("bold")
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBackground(CONFIG.THEME.PRIMARY_DARK);

    // Input Label & Cell
    sheet.getRange("G5").setValue("Search query (Name/Phone/ID):")
      .setFontFamily("Inter")
      .setFontSize(8)
      .setFontColor(CONFIG.THEME.TEXT_MUTED)
      .setVerticalAlignment("middle");

    var searchInput = sheet.getRange("G6");
    searchInput.setValue("")
      .setFontFamily("Inter")
      .setFontSize(11)
      .setBackground("#FAFAFA")
      .setHorizontalAlignment("left")
      .setVerticalAlignment("middle");
    searchInput.setBorder(true, true, true, true, null, null, CONFIG.THEME.BORDER_LIGHT, SpreadsheetApp.BorderStyle.SOLID);

    // Live Trigger Action Buttons
    var runBtn = sheet.getRange("H5");
    runBtn.setValue("🔍 RUN QUERY")
      .setFontFamily("Inter")
      .setFontSize(8)
      .setFontWeight("bold")
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    var clearBtn = sheet.getRange("H6");
    clearBtn.setValue("✕ CLEAR INPUT")
      .setFontFamily("Inter")
      .setFontSize(8)
      .setFontWeight("bold")
      .setFontColor(CONFIG.THEME.PRIMARY_DARK)
      .setBackground("#FAFAFA")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
      
    // Apply container outline
    sheet.getRange("G4:H6").setBorder(true, true, true, true, null, null, CONFIG.THEME.PRIMARY_DARK, SpreadsheetApp.BorderStyle.SOLID);
  },

  /**
   * Handles user trigger on 'onSelectionChange' to process interactive queries.
   */
  handleSelectionTrigger: function(row, col) {
    if (row === 5 && col === 8) { // H5 cell - RUN QUERY
      this.executeSearchQuery();
    } else if (row === 6 && col === 8) { // H6 cell - CLEAR INPUT
      this.clearSearchQuery();
    }
  },

  /**
   * Filters the main Orders sheet rows to match inputs.
   */
  executeSearchQuery: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
      var query = dashSheet.getRange("G6").getValue().toString().trim().toLowerCase();
      
      if (!query) {
        SpreadsheetApp.getUi().alert("Roy Men Concierge", "Please type a phone number, customer name, or order ID in the input box cell [G6] first.", SpreadsheetApp.getUi().ButtonSet.OK);
        return;
      }

      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!ordersSheet) return;

      var data = ordersSheet.getDataRange().getValues();
      var matches = [];

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var orderId = row[1].toString().toLowerCase();
        var clientName = row[3].toString().toLowerCase();
        var phone = row[4].toString().toLowerCase();
        
        if (orderId.indexOf(query) !== -1 || clientName.indexOf(query) !== -1 || phone.indexOf(query) !== -1) {
          matches.push(row);
        }
      }

      // Draw search output container
      dashSheet.getRange("A10:H100").clear();
      
      if (matches.length === 0) {
        dashSheet.getRange("A10:H10").merge()
          .setValue("✕ NO TRANSACTIONS FOUND MATCHING QUERY: '" + query.toUpperCase() + "'")
          .setFontFamily("Inter")
          .setFontSize(10)
          .setFontWeight("bold")
          .setFontColor(CONFIG.THEME.COLOR_ERROR)
          .setHorizontalAlignment("center");
        return;
      }

      // Render search matching results
      var headers = ["Timestamp", "Order ID", "Customer Name", "Phone", "Payment", "Order Status", "Grand Total", "Courier Status"];
      dashSheet.getRange("A10:H10").setValues([headers])
        .setFontFamily("Inter")
        .setFontSize(8)
        .setFontWeight("bold")
        .setFontColor(CONFIG.THEME.TEXT_LIGHT)
        .setBackground(CONFIG.THEME.PRIMARY_DARK);

      var resultsGrid = [];
      for (var k = 0; k < matches.length; k++) {
        var m = matches[k];
        resultsGrid.push([
          m[0] ? Utils.formatDateTimeInDhaka(m[0]).substring(0, 10) : "N/A",
          m[1], // Order ID
          m[3], // Customer Name
          m[4], // Phone
          m[11], // Payment Status
          m[12], // Order Status
          m[21], // Grand Total
          m[22] || "Pending Assignment" // Courier
        ]);
      }

      dashSheet.getRange(11, 1, resultsGrid.length, 8).setValues(resultsGrid)
        .setFontFamily("Inter")
        .setFontSize(9)
        .setVerticalAlignment("middle");

      dashSheet.getRange(11, 7, resultsGrid.length, 1).setNumberFormat("৳#,##0"); // Totals formatting
      
      // Zebra shading for outputs
      Utils.applyZebraStriping(dashSheet, 11, resultsGrid.length + 10, 8);
      dashSheet.getRange(10, 1, resultsGrid.length + 1, 8).setBorder(true, true, true, true, true, true, CONFIG.THEME.BORDER_LIGHT, SpreadsheetApp.BorderStyle.SOLID);

    } catch (e) {
      console.error("Search failure: " + e.toString());
    }
  },

  /**
   * Resets search display.
   */
  clearSearchQuery: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
      dashSheet.getRange("G6").setValue("");
      dashSheet.getRange("A10:H100").clear();
    } catch (e) {
      console.error("Error clearing search: " + e.toString());
    }
  }
};
