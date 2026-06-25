/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: Utils.gs
 * ROLE: System Utilities & Data Formatting Helpers
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var Utils = {
  /**
   * Formats a standard JavaScript Date object into Bangladesh Standard Time (BST).
   * @param {Date} date - The date to format.
   * @return {string} Formatted string "YYYY-MM-DD HH:mm:ss".
   */
  formatDateTimeInDhaka: function(date) {
    if (!date) date = new Date();
    try {
      return Utilities.formatDate(date, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    } catch (e) {
      console.error("Error formatting date: " + e.toString());
      return date.toString();
    }
  },

  /**
   * Helper to build uniform JSON outputs for Google web app requests.
   * @param {Object} body - Response payload object.
   * @param {number} statusCode - HTTP status code.
   * @return {HtmlOutput} JSON formatted output with secure sandbox rules.
   */
  createJsonResponse: function(body, statusCode) {
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Add transaction response metadata
    body.processedAt = this.formatDateTimeInDhaka(new Date());
    body.statusCode = statusCode || 200;
    
    output.setContent(JSON.stringify(body));
    return output;
  },

  /**
   * Safe JSON parse helper to prevent server-side exceptions.
   * @param {string} jsonString - The string to parse.
   * @return {Object|null} Parsed object or null on failure.
   */
  safeJsonParse: function(jsonString) {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn("Invalid JSON format caught: " + e.toString());
      return null;
    }
  },

  /**
   * Generates a clean zebra striping range formatting for sheet grids.
   * @param {Sheet} sheet - Target Sheet object.
   * @param {number} startRow - Beginning row index.
   * @param {number} lastRow - Ending row index.
   * @param {number} totalCols - Ending column index.
   */
  applyZebraStriping: function(sheet, startRow, lastRow, totalCols) {
    if (lastRow < startRow) return;
    try {
      var range = sheet.getRange(startRow, 1, lastRow - startRow + 1, totalCols);
      range.setBackground("#FFFFFF"); // Default baseline background
      
      // Filter rows to apply zebra shading
      for (var r = startRow; r <= lastRow; r++) {
        if (r % 2 === 0) {
          sheet.getRange(r, 1, 1, totalCols).setBackground(CONFIG.THEME.BG_LIGHT_ZEBRA);
        }
      }
    } catch (e) {
      console.error("Zebra striping error: " + e.toString());
    }
  }
};
