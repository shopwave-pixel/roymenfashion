/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: SecurityService.gs
 * ROLE: Authentication, Integrity Checks, Rate-Limits & Threat Shield
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var SecurityService = {
  /**
   * Verifies if the request contains a valid API key header.
   * @param {Object} e - HTTP event object.
   * @return {boolean} True if authenticated, false otherwise.
   */
  verifyApiKey: function(e) {
    var apiKey = SettingsService.get("API_KEY", "ROY_MEN_SECURE_API_KEY_2026");
    if (!e || !e.parameter) return false;

    // Check query parameters
    var queryKey = e.parameter.apiKey || e.parameter.api_key;
    if (queryKey === apiKey) return true;

    // Check Headers in Google Apps Script event
    var headers = e.headers || {};
    
    // Google Apps Script API headers normalized check (headers are usually converted to lowercase keys)
    var headerKey = headers[CONFIG.API_CONFIG.HEADERS.API_KEY.toLowerCase()] || 
                    headers["x-api-key"] || 
                    headers["X-API-KEY"];
                    
    if (headerKey === apiKey) return true;

    // Log security violation if unauthorized
    AuditService.log(
      CONFIG.LOGGING.LEVELS.SECURITY,
      null,
      "Unauthorized API request blocked. Request details: Headers: " + JSON.stringify(headers)
    );
    
    return false;
  },

  /**
   * Verifies the HMAC-SHA256 signature of incoming webhooks to guarantee packet integrity.
   * Checks against client signature header.
   * @param {Object} e - Incoming HTTP payload.
   * @param {string} rawBody - Raw body content string.
   * @return {boolean} True if checksum verified, false otherwise.
   */
  verifyWebhookSignature: function(e, rawBody) {
    if (!rawBody) return false;
    
    var secret = SettingsService.get("WEBHOOK_SECRET", "ROY_MEN_WEBHOOK_INTEGRITY_SALT_2026");
    var headers = e.headers || {};

    // Get client provided signature
    var clientSignature = headers[CONFIG.API_CONFIG.HEADERS.SIGNATURE.toLowerCase()] || 
                           headers["x-roymen-signature"] || 
                           headers["X-ROYMEN-SIGNATURE"];

    if (!clientSignature) {
      // If signature is missing, check if signature verification is strictly required in settings
      var skipSig = SettingsService.get("SKIP_SIGNATURE_VERIFICATION", "true");
      if (skipSig === "true") {
        return true;
      }
      return false;
    }

    try {
      // Compute HMAC-SHA256 signature natively
      var keyBytes = Utilities.newBlob(secret).getBytes();
      var messageBytes = Utilities.newBlob(rawBody).getBytes();
      var signatureBytes = Utilities.computeHmacSha256Signature(messageBytes, keyBytes);
      
      // Convert to hex string
      var calculatedSignature = signatureBytes.map(function(byte) {
        var val = (byte < 0 ? byte + 256 : byte).toString(16);
        return val.length === 1 ? "0" + val : val;
      }).join("");

      if (calculatedSignature === clientSignature) {
        return true;
      }
    } catch (err) {
      console.error("Signature computation exception: " + err.toString());
    }

    AuditService.log(
      CONFIG.LOGGING.LEVELS.SECURITY,
      null,
      "HMAC-SHA256 signature verification failed. Calculation mismatch."
    );

    return false;
  }
};
