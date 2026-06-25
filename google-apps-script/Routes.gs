/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: Routes.gs
 * ROLE: Web Request Routers & API Endpoint Controllers (GET / POST)
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

/**
 * Handles HTTP GET requests. Offers active diagnostics, database integrity checks,
 * and service metrics tracking.
 * @param {Object} e - Incoming HTTP event request.
 * @return {TextOutput} JSON formatted server logs.
 */
function doGet(e) {
  try {
    // 1. Verify API Key first for basic system protection
    if (!SecurityService.verifyApiKey(e)) {
      return Utils.createJsonResponse({
        status: "unauthorized",
        code: "INVALID_API_KEY",
        message: "Request rejected: missing or invalid corporate API key."
      }, 401);
    }

    // 2. Proactively run schema checks
    App.initializeAllSheets();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
    var orderRows = ordersSheet ? ordersSheet.getLastRow() : 0;
    var orderCount = orderRows > 1 ? orderRows - 1 : 0;

    return Utils.createJsonResponse({
      status: "active",
      engine: CONFIG.PROJECT_NAME,
      version: CONFIG.VERSION,
      timezone: CONFIG.TIMEZONE,
      sheets: Object.keys(CONFIG.SHEETS).map(function(k) { return CONFIG.SHEETS[k]; }),
      systemMetrics: {
        totalOrdersRecorded: orderCount,
        spreadsheetUrl: ss.getUrl()
      }
    }, 200);

  } catch (err) {
    console.error("GET Route Exception: " + err.toString());
    return Utils.createJsonResponse({
      status: "error",
      code: "ROUTER_GET_EXCEPTION",
      message: err.toString()
    }, 500);
  }
}

/**
 * Handles HTTP POST Webhook requests. Processes real-time order payloads
 * from the Railway backend (Insert, Update, Delete transactions).
 * @param {Object} e - Incoming HTTP event request containing body contents.
 * @return {TextOutput} JSON transaction summary.
 */
function doPost(e) {
  var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "";
  
  try {
    // 1. Safe parse check
    if (!rawBody) {
      return Utils.createJsonResponse({
        status: "error",
        code: "EMPTY_PAYLOAD",
        message: "No POST body content was received."
      }, 400);
    }

    var payload = Utils.safeJsonParse(rawBody);
    if (!payload) {
      return Utils.createJsonResponse({
        status: "error",
        code: "INVALID_JSON",
        message: "Malformed JSON payload format."
      }, 400);
    }

    // 2. Authenticate secure API access key
    if (!SecurityService.verifyApiKey(e)) {
      return Utils.createJsonResponse({
        status: "unauthorized",
        code: "INVALID_API_KEY",
        message: "Request rejected: invalid API key."
      }, 401);
    }

    // 3. Webhook Integrity Handshake (HMAC Verification)
    if (!SecurityService.verifyWebhookSignature(e, rawBody)) {
      return Utils.createJsonResponse({
        status: "unauthorized",
        code: "INVALID_SIGNATURE",
        message: "HMAC signature verification failed. Packet integrity compromised."
      }, 401);
    }

    // 4. Ensure directory structures are fully formatted
    App.initializeAllSheets();

    var action = payload.action ? payload.action.toString().trim().toLowerCase() : "insert";

    // ==============================================
    // ROUTE: DELETE TRANSACTION
    // ==============================================
    if (action === "delete") {
      if (!payload.orderId) {
        return Utils.createJsonResponse({ status: "error", code: "MISSING_ORDER_ID", message: "orderId is required for deletions." }, 400);
      }
      var result = OrderService.deleteOrder(payload.orderId);
      return Utils.createJsonResponse(result, 200);
    }

    // ==============================================
    // ROUTE: INSERT OR UPDATE TRANSACTIONS
    // ==============================================
    var validation = ValidationService.validateOrder(payload);
    if (!validation.isValid) {
      return Utils.createJsonResponse({
        status: "error",
        code: "VALIDATION_FAILED",
        message: "Schema constraints violated: " + validation.errors.join(", ")
      }, 400);
    }

    if (action === "update") {
      var result = OrderService.updateOrder(payload);
      return Utils.createJsonResponse(result, 200);
    } else {
      // Default: insert order
      var result = OrderService.insertOrder(payload);
      return Utils.createJsonResponse(result, 201);
    }

  } catch (err) {
    console.error("POST Route Exception: " + err.toString());
    
    AuditService.log(
      CONFIG.LOGGING.LEVELS.ERROR,
      null,
      "Webhook route crashed. Reason: " + err.toString()
    );

    return Utils.createJsonResponse({
      status: "error",
      code: "ROUTER_POST_EXCEPTION",
      message: err.message || err.toString()
    }, 500);
  }
}
