/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: WebhookService.gs
 * ROLE: Outbound Synchronization, Retries & Offline Queue Controller
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var WebhookService = {
  /**
   * Safely dispatches synchronous updates to the MERN e-commerce backend.
   * On failure, caches payload in a local offline buffer for automated trigger retries.
   * @param {Object} payload - Sync package containing order updates.
   */
  syncStatusToBackend: function(payload) {
    var backendUrl = SettingsService.get("BACKEND_URL", "");
    if (!backendUrl) {
      console.warn("Backend server URL is unconfigured. Skipping synchronization.");
      return;
    }

    // Standardize URL paths
    if (backendUrl.substring(backendUrl.length - 1) === "/") {
      backendUrl = backendUrl.substring(0, backendUrl.length - 1);
    }
    var url = backendUrl + "/api/orders/sync-status";
    var apiKey = SettingsService.get("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var maxRetries = CONFIG.API_CONFIG.RETRY_COUNT;
    var delayMs = CONFIG.API_CONFIG.RETRY_DELAY_MS;
    var attempt = 0;
    var success = false;
    var responseCode = 0;
    var errorMsg = "";

    while (attempt < maxRetries && !success) {
      attempt++;
      try {
        var response = UrlFetchApp.fetch(url, options);
        responseCode = response.getResponseCode();
        
        if (responseCode === 200 || responseCode === 201) {
          success = true;
          console.log("Synced order " + payload.orderId + " back to server (Attempt " + attempt + ")");
          AuditService.log(
            "Sync Success",
            payload.orderId,
            "Synchronized order status to Railway server."
          );
        } else {
          errorMsg = "HTTP " + responseCode + " Error: " + response.getContentText();
          console.warn("Sync failed on attempt " + attempt + ": " + errorMsg);
          if (attempt < maxRetries) {
            Utilities.sleep(delayMs * attempt); // Linear retry backoff
          }
        }
      } catch (e) {
        errorMsg = e.toString();
        console.error("Fetch failed on attempt " + attempt + ": " + errorMsg);
        if (attempt < maxRetries) {
          Utilities.sleep(delayMs * attempt);
        }
      }
    }

    if (!success) {
      this.queueFailedSync(payload, errorMsg);
    }
  },

  /**
   * Caches a failed sync packet locally to protect state transactions.
   */
  queueFailedSync: function(payload, errorMsg) {
    try {
      var props = PropertiesService.getScriptProperties();
      var failedQueue = JSON.parse(props.getProperty(CONFIG.QUEUE.FAILED_SYNC) || "[]");
      
      // Prevent infinite growth
      if (failedQueue.length >= CONFIG.QUEUE.SIZE_LIMIT) {
        failedQueue.shift();
      }

      // Check for existing order in queue to avoid duplicates
      var existingIndex = -1;
      for (var i = 0; i < failedQueue.length; i++) {
        if (failedQueue[i].orderId === payload.orderId) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex !== -1) {
        failedQueue[existingIndex] = payload; // Overwrite with newest
      } else {
        failedQueue.push(payload);
      }

      props.setProperty(CONFIG.QUEUE.FAILED_SYNC, JSON.stringify(failedQueue));
      
      AuditService.log(
        "Sync Buffered",
        payload.orderId,
        "Outbound sync offline. Buffered to queue. Code: " + errorMsg
      );
    } catch (e) {
      console.error("Queue database sync fail: " + e.toString());
    }
  },

  /**
   * Periodically triggered routine that flushes offline updates back online.
   */
  processFailedSyncQueue: function() {
    try {
      var props = PropertiesService.getScriptProperties();
      var queueJson = props.getProperty(CONFIG.QUEUE.FAILED_SYNC);
      if (!queueJson) return;

      var queue = JSON.parse(queueJson);
      if (queue.length === 0) return;

      console.log("Resubmitting " + queue.length + " pending updates from offline sync queue...");
      var remainingQueue = [];

      var backendUrl = SettingsService.get("BACKEND_URL", "");
      if (!backendUrl) return;

      if (backendUrl.substring(backendUrl.length - 1) === "/") {
        backendUrl = backendUrl.substring(0, backendUrl.length - 1);
      }
      var url = backendUrl + "/api/orders/sync-status";
      var apiKey = SettingsService.get("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");

      for (var i = 0; i < queue.length; i++) {
        var payload = queue[i];
        
        var options = {
          method: "post",
          contentType: "application/json",
          headers: {
            "x-api-key": apiKey
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };

        try {
          var response = UrlFetchApp.fetch(url, options);
          if (response.getResponseCode() === 200 || response.getResponseCode() === 201) {
            console.log("Offline synchronized: #" + payload.orderId);
            AuditService.log("Sync Recovered", payload.orderId, "Successfully synchronized buffered order state to database.");
          } else {
            remainingQueue.push(payload);
          }
        } catch (e) {
          console.warn("Retrying buffered order #" + payload.orderId + " failed: " + e.toString());
          remainingQueue.push(payload);
        }
      }

      props.setProperty(CONFIG.QUEUE.FAILED_SYNC, JSON.stringify(remainingQueue));
    } catch (e) {
      console.error("Error processing failed sync queue: " + e.toString());
    }
  }
};
