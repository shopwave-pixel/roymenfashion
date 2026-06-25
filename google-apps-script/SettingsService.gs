/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: SettingsService.gs
 * ROLE: Global Parameters & Dynamic Environment Variable Controller
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var SettingsService = {
  /**
   * Retrieves a corporate configuration or business parameter.
   * Leverages custom caching to skip sheet read times.
   * @param {string} key - Parameter configuration name.
   * @param {any} defaultValue - Fallback value if key is not found.
   * @return {string} Configured parameter value.
   */
  get: function(key, defaultValue) {
    var cache = CacheService.getScriptCache();
    var cachedValue = cache.get(CONFIG.CACHE.SETTINGS_KEY + "_" + key);
    if (cachedValue !== null) {
      return cachedValue;
    }

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
      if (!sheet) {
        this.initializeSettingsSheet(ss);
        return defaultValue;
      }

      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          var val = data[i][1].toString().trim();
          cache.put(CONFIG.CACHE.SETTINGS_KEY + "_" + key, val, CONFIG.CACHE_DEFAULT_TTL);
          return val;
        }
      }
    } catch (e) {
      console.warn("Error reading setting cell: " + e.toString());
    }

    // Secondary fallback to Script Properties
    var propVal = PropertiesService.getScriptProperties().getProperty(key);
    if (propVal !== null) {
      return propVal;
    }

    return defaultValue;
  },

  /**
   * Safe set/overwrite configuration variable.
   * @param {string} key - Target key name.
   * @param {string} value - Value to commit.
   */
  set: function(key, value) {
    var cache = CacheService.getScriptCache();
    cache.put(CONFIG.CACHE.SETTINGS_KEY + "_" + key, value, CONFIG.CACHE_DEFAULT_TTL);

    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var found = false;
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === key) {
            sheet.getRange(i + 1, 2).setValue(value);
            found = true;
            break;
          }
        }
        if (!found) {
          sheet.appendRow([key, value, "Auto-generated parameter"]);
        }
      }
    } catch (e) {
      console.error("Error writing setting cell: " + e.toString());
    }

    PropertiesService.getScriptProperties().setProperty(key, value);
  },

  /**
   * Initializes the settings sheet with basic core values.
   * @param {Spreadsheet} ss - Parent Spreadsheet reference.
   */
  initializeSettingsSheet: function(ss) {
    var sheet = ss.getSheetByName(CONFIG.SHEETS.SETTINGS);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEETS.SETTINGS);
    }
    sheet.clear();
    
    // Set headers
    sheet.getRange(1, 1, 1, 3).setValues([["Setting Key", "Value", "Description"]])
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold");

    // Seed defaults
    var defaultSettings = [
      ["BACKEND_URL", "https://roymen-backend.railway.app", "The Railway Express backend root sync URL"],
      ["API_KEY", "ROY_MEN_SECURE_API_KEY_2026", "Security key header matching MERN server"],
      ["WEBHOOK_SECRET", "ROY_MEN_WEBHOOK_INTEGRITY_SALT_2026", "HMAC key to check payload checksums"],
      ["ADMIN_ALERT_EMAIL", "concierge@roymen.com", "Recipient for order dispatch notices"],
      ["SENDER_EMAIL_MASK", "concierge@roymen.com", "Optional authorized alias for email notifications"]
    ];

    sheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
    sheet.autoResizeColumns(1, 3);
  }
};
