/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: TriggerService.gs
 * ROLE: Programmatic Cron Triggers & Task Scheduling Controller
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var TriggerService = {
  /**
   * Safe initialization of time-driven crons.
   * Cleans existing triggers first to avoid multiple scheduler duplicates.
   */
  setupAutomatedCronTriggers: function() {
    try {
      this.clearAllSystemTriggers();

      // 1. Establish 5-minute sync/retry flush queues
      ScriptApp.newTrigger("runEvery5Minutes")
        .timeBased()
        .everyMinutes(CONFIG.TRIGGERS.RETRY_QUEUE_INTERVAL_MIN)
        .create();

      // 2. Establish 24-hour spreadsheet backups
      ScriptApp.newTrigger("backupOrdersLedger")
        .timeBased()
        .everyHours(CONFIG.TRIGGERS.BACKUP_INTERVAL_HOURS)
        .create();

      // 3. Establish 12-hour background analytics indexing
      ScriptApp.newTrigger("recalculateCatalogAndAnalytics")
        .timeBased()
        .everyHours(CONFIG.TRIGGERS.ANALYTICS_INTERVAL_HOURS)
        .create();

      AuditService.log(
        CONFIG.LOGGING.LEVELS.INFO,
        null,
        "System background triggers (5-min flusher, 24-hr backups, 12-hr analytical compilation) installed successfully."
      );
    } catch (e) {
      console.error("Scheduler setup exception: " + e.toString());
      AuditService.log(CONFIG.LOGGING.LEVELS.ERROR, null, "Failed creating triggers: " + e.toString());
    }
  },

  /**
   * Deletes all automated background runs for clean re-installations.
   */
  clearAllSystemTriggers: function() {
    try {
      var triggers = ScriptApp.getProjectTriggers();
      for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
      }
      console.log("All project cron triggers removed.");
    } catch (e) {
      console.error("Error purging triggers: " + e.toString());
    }
  }
};
