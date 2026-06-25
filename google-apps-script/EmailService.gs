/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: EmailService.gs
 * ROLE: Safe Email Dispatcher & Error Shield
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var EmailService = {
  /**
   * Universal sending engine wrapping MailApp and GmailApp in protective try-catch.
   * Prevents runtime email failures from halting crucial spreadsheet database writes.
   * @param {string} recipient - Target email address.
   * @param {string} subject - Email subject line.
   * @param {string} htmlBody - HTML content built by Templates.
   * @return {boolean} True if sent successfully, false on caught exception.
   */
  send: function(recipient, subject, htmlBody) {
    if (!recipient) return false;
    
    var senderName = CONFIG.EMAIL_CONFIG.SENDER_NAME;
    var senderMask = SettingsService.get("SENDER_EMAIL_MASK", "");
    var provider = CONFIG.EMAIL_CONFIG.PROVIDER;

    var mailOptions = {
      to: recipient,
      subject: subject,
      htmlBody: htmlBody,
      name: senderName
    };

    // If an authorized alias email mask is configured, try utilizing it
    if (senderMask && senderMask !== "") {
      mailOptions.from = senderMask;
    }

    try {
      if (provider === "GmailApp") {
        GmailApp.sendEmail(recipient, subject, "", mailOptions);
      } else {
        MailApp.sendEmail(mailOptions);
      }
      
      console.log("Email dispatch succeeded to: " + recipient);
      return true;
    } catch (err) {
      // LOG ERROR BUT RECOVER SO SCRIPT CONTINUES TO WRITE DATA
      console.error("EMAIL SERVICE ERROR: Failed sending email to " + recipient + ". Reason: " + err.toString());
      
      AuditService.log(
        CONFIG.LOGGING.LEVELS.ERROR,
        null,
        "Failed emailing to " + recipient + ". Message: " + err.toString()
      );

      // Save failed dispatch to retry queue in PropertiesService
      this.queueFailedEmail(recipient, subject, htmlBody);
      return false;
    }
  },

  /**
   * Safely dispatches transactional status emails to customers based on state.
   * @param {Object} orderPayload - The validated order object data.
   * @param {string} status - Selected Order status.
   */
  sendOrderStatusNotification: function(orderPayload, status) {
    if (!orderPayload.email) return;
    
    var subject = "ROY MEN Order Update #" + orderPayload.orderId + " [" + status + "]";
    var htmlContent = Templates.getOrderStatusEmail(orderPayload, status);
    
    this.send(orderPayload.email, subject, htmlContent);
  },

  /**
   * Dispatches critical notifications to corporate admin regarding sales.
   * @param {Object} orderPayload - The validated order data.
   */
  sendAdminAlertNotification: function(orderPayload) {
    var adminEmail = SettingsService.get("ADMIN_ALERT_EMAIL", CONFIG.EMAIL_CONFIG.ADMIN_EMAIL);
    var subject = "[ALERT] New Sales Invoice #" + orderPayload.orderId;
    var htmlContent = Templates.getAdminNotification(orderPayload);
    
    this.send(adminEmail, subject, htmlContent);
  },

  /**
   * Stores failed email details in script cache for retry queues.
   */
  queueFailedEmail: function(recipient, subject, htmlBody) {
    try {
      var props = PropertiesService.getScriptProperties();
      var failedQueue = JSON.parse(props.getProperty(CONFIG.QUEUE.FAILED_EMAIL) || "[]");
      
      // Enforce queue size safety
      if (failedQueue.length >= CONFIG.QUEUE.SIZE_LIMIT) {
        failedQueue.shift(); // Remove oldest to prevent storage crash
      }
      
      failedQueue.push({
        recipient: recipient,
        subject: subject,
        htmlBody: htmlBody,
        timestamp: new Date().getTime()
      });
      
      props.setProperty(CONFIG.QUEUE.FAILED_EMAIL, JSON.stringify(failedQueue));
    } catch (e) {
      console.error("Failed caching queue email: " + e.toString());
    }
  },

  /**
   * Process and re-send all queued failed emails.
   */
  processFailedEmailQueue: function() {
    try {
      var props = PropertiesService.getScriptProperties();
      var queueJson = props.getProperty(CONFIG.QUEUE.FAILED_EMAIL);
      if (!queueJson) return;

      var queue = JSON.parse(queueJson);
      if (queue.length === 0) return;

      console.log("Retry processing " + queue.length + " failed emails from queue...");
      var remainingQueue = [];

      for (var i = 0; i < queue.length; i++) {
        var mail = queue[i];
        
        // Attempt sending again
        var success = false;
        try {
          if (CONFIG.EMAIL_CONFIG.PROVIDER === "GmailApp") {
            GmailApp.sendEmail(mail.recipient, mail.subject, "", {
              htmlBody: mail.htmlBody,
              name: CONFIG.EMAIL_CONFIG.SENDER_NAME
            });
          } else {
            MailApp.sendEmail({
              to: mail.recipient,
              subject: mail.subject,
              htmlBody: mail.htmlBody,
              name: CONFIG.EMAIL_CONFIG.SENDER_NAME
            });
          }
          success = true;
        } catch (err) {
          console.warn("Reprocess email fail to " + mail.recipient + ": " + err.toString());
        }

        if (!success) {
          // If still failing, keep in queue (unless older than 24 hours)
          var ageMs = new Date().getTime() - mail.timestamp;
          if (ageMs < 86400000) {
            remainingQueue.push(mail);
          }
        } else {
          console.log("Queued email re-delivered to: " + mail.recipient);
        }
      }

      props.setProperty(CONFIG.QUEUE.FAILED_EMAIL, JSON.stringify(remainingQueue));
    } catch (e) {
      console.error("Queue retry execution exception: " + e.toString());
    }
  }
};
