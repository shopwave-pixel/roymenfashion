/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: AnalyticsService.gs
 * ROLE: Visual Analytics & Native Embedded Charts Designer
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var AnalyticsService = {
  /**
   * Refreshes the embedded charts on the Reports sheet to show real-time business trajectories.
   */
  generateOperationalCharts: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var reportsSheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
      if (!reportsSheet) return;

      // Clean existing charts to avoid overlapping duplicate layers
      var charts = reportsSheet.getCharts();
      for (var i = 0; i < charts.length; i++) {
        reportsSheet.removeChart(charts[i]);
      }

      var lastRow = reportsSheet.getLastRow();
      // Need at least some aggregated months to draw charts (Row 4 is headers, Row 5+ is data)
      if (lastRow <= 5) return;

      // 1. Generate elegant Monthly Revenue Bar Chart
      var rangeMonths = reportsSheet.getRange("A4:A" + (lastRow - 2)); // skip total row
      var rangeRevenue = reportsSheet.getRange("C4:C" + (lastRow - 2));

      var revenueChart = reportsSheet.newChart()
        .setChartType(Charts.ChartType.COLUMN)
        .addRange(rangeMonths)
        .addRange(rangeRevenue)
        .setNumHeaders(1)
        .setOption("title", "MONTH-OVER-MONTH REVENUE")
        .setOption("colors", [CONFIG.THEME.PRIMARY_DARK])
        .setOption("fontName", "Inter")
        .setOption("legend", { position: "none" })
        .setOption("vAxis", { gridlines: { color: CONFIG.THEME.BORDER_LIGHT } })
        .setOption("chartArea", { width: "80%", height: "70%" })
        .setPosition(4, 5, 20, 20) // Row 4, Column E
        .setWidth(550)
        .setHeight(300)
        .build();

      reportsSheet.insertChart(revenueChart);

      // 2. Generate Order Volume Area Chart
      var rangeVolume = reportsSheet.getRange("B4:B" + (lastRow - 2));
      var volumeChart = reportsSheet.newChart()
        .setChartType(Charts.ChartType.AREA)
        .addRange(rangeMonths)
        .addRange(rangeVolume)
        .setNumHeaders(1)
        .setOption("title", "ORDER VOLUME TRAJECTORY")
        .setOption("colors", [CONFIG.THEME.ACCENT_GOLD])
        .setOption("fontName", "Inter")
        .setOption("legend", { position: "none" })
        .setOption("vAxis", { gridlines: { color: CONFIG.THEME.BORDER_LIGHT } })
        .setOption("chartArea", { width: "80%", height: "70%" })
        .setPosition(20, 5, 20, 20) // Row 20, Column E
        .setWidth(550)
        .setHeight(300)
        .build();

      reportsSheet.insertChart(volumeChart);

      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Operational dashboard charts successfully compiled and formatted.");
    } catch (e) {
      console.error("Charts generation failure: " + e.toString());
    }
  }
};
