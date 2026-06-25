/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: AuditService.gs
 * ROLE: Diagnostic Logger & Self-Pruning Audit Log Controller
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var AuditService = {
  /**
   * Appends an audit track event to the system log ledger.
   * Performs self-cleaning if log sheet exceeds performance row limit.
   * @param {string} eventType - Category (e.g. INFO, ERROR, SECURITY, INSERT, UPDATE).
   * @param {string} orderId - Affected order context (if applicable, else empty).
   * @param {string} details - Log text detail block.
   */
  log: function(eventType, orderId, details) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEETS.AUDIT_LOG);
        sheet.appendRow(CONFIG.HEADERS.AUDIT_LOG);
        this.applyAuditHeaderStyling(sheet);
      }

      var timestamp = Utils.formatDateTimeInDhaka(new Date());
      var rowData = [timestamp, eventType, orderId || "N/A", details];
      
      // Thread-safe lock when appending to logging sheets
      sheet.appendRow(rowData);
      
      // Auto pruning trigger to save cell limits on heavy operations
      this.autoPruneLogs(sheet);
    } catch (e) {
      console.error("CRITICAL LOGGER EXCEPTION: " + e.toString());
    }
  },

  /**
   * Applies the Quiet Luxury headers style to Audit Log sheet.
   * @param {Sheet} sheet - Target Sheet.
   */
  applyAuditHeaderStyling: function(sheet) {
    sheet.getRange(1, 1, 1, CONFIG.HEADERS.AUDIT_LOG.length)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold")
      .setFontFamily("Inter");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, CONFIG.HEADERS.AUDIT_LOG.length);
  },

  /**
   * Prunes log rows dynamically if they exceed CONFIG.LOGGING.MAX_LOG_ROWS.
   * Keeps oldest logs truncated.
   * @param {Sheet} sheet - Target Log Sheet.
   */
  autoPruneLogs: function(sheet) {
    var maxRows = CONFIG.LOGGING.MAX_LOG_ROWS;
    var lastRow = sheet.getLastRow();
    
    if (lastRow > maxRows) {
      // Retain header (Row 1) and delete oldest rows
      var excessRows = lastRow - maxRows;
      sheet.deleteRows(2, excessRows);
      
      // Log truncation event
      var timestamp = Utils.formatDateTimeInDhaka(new Date());
      sheet.appendRow([
        timestamp,
        CONFIG.LOGGING.LEVELS.INFO,
        "SYSTEM",
        "Pruning executed successfully. Cleaned up " + excessRows + " stale historical audit trails."
      ]);
    }
  }
};
