/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: HistoryService.gs
 * ROLE: Order State Transitions & Financial Audit Trails Manager
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var HistoryService = {
  /**
   * Appends an entry tracking changes to an order's fulfillment state.
   * @param {string} orderId - The target order identifier.
   * @param {string} prevStatus - The state before the transition.
   * @param {string} newStatus - The target fulfillment state.
   * @param {string} changedBy - Initiating agent identifier.
   */
  logOrderStatus: function(orderId, prevStatus, newStatus, changedBy) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDER_HISTORY);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.ORDER_HISTORY);
        sheet.appendRow(CONFIG.HEADERS.ORDER_HISTORY);
        this.applyHeaderStyling(sheet, CONFIG.HEADERS.ORDER_HISTORY.length);
      }

      var timestamp = Utils.formatDateTimeInDhaka(new Date());
      sheet.appendRow([timestamp, orderId, prevStatus || "None", newStatus, changedBy || "System Process"]);
      
      // Perform automatic zebra striping to keep histories clean
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        Utils.applyZebraStriping(sheet, 2, lastRow, CONFIG.HEADERS.ORDER_HISTORY.length);
      }
    } catch (e) {
      console.error("Error logging Order status change: " + e.toString());
    }
  },

  /**
   * Appends an entry tracking changes to an order's payment/billing state.
   * @param {string} orderId - The target order identifier.
   * @param {string} prevStatus - The state before the transition.
   * @param {string} newStatus - The target payment state.
   * @param {string} changedBy - Initiating agent identifier.
   */
  logPaymentStatus: function(orderId, prevStatus, newStatus, changedBy) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.PAYMENT_HISTORY);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.PAYMENT_HISTORY);
        sheet.appendRow(CONFIG.HEADERS.PAYMENT_HISTORY);
        this.applyHeaderStyling(sheet, CONFIG.HEADERS.PAYMENT_HISTORY.length);
      }

      var timestamp = Utils.formatDateTimeInDhaka(new Date());
      sheet.appendRow([timestamp, orderId, prevStatus || "None", newStatus, changedBy || "System Process"]);
      
      // Perform automatic zebra striping to keep histories clean
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        Utils.applyZebraStriping(sheet, 2, lastRow, CONFIG.HEADERS.PAYMENT_HISTORY.length);
      }
    } catch (e) {
      console.error("Error logging Payment status change: " + e.toString());
    }
  },

  /**
   * Applies the Quiet Luxury headers style to history sheets.
   * @param {Sheet} sheet - Target Sheet.
   * @param {number} totalCols - Columns span.
   */
  applyHeaderStyling: function(sheet, totalCols) {
    sheet.getRange(1, 1, 1, totalCols)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold")
      .setFontFamily("Inter");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, totalCols);
  }
};
