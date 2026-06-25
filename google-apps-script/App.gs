/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: App.gs
 * ROLE: Main Project Orchestrator & Event Triggers Entrance
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

/**
 * CUSTOM EXPORT & AUDIT MENU SETUP
 * Automatically initializes when the spreadsheet is opened.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🏆 ROY MEN Dashboard")
      .addItem("📊 Refresh Dashboard Data", "refreshDashboard")
      .addItem("🔄 Rebuild Structure & Shemas", "initializeAllSheets")
      .addItem("🕒 Setup Scheduled Triggers", "createTimeDrivenTriggers")
      .addSeparator()
      .addItem("📄 Export PDF Report", "exportPdfReport")
      .addItem("📝 Export CSV Orders", "exportCsvOrders")
      .addItem("📈 Export Excel Worksheet", "exportExcelWorksheet")
      .addSeparator()
      .addItem("💾 Backup Orders Ledger", "backupOrdersLedger")
      .addToUi();
  } catch (e) {
    console.error("Menu creation failed: " + e.toString());
  }
}

/**
 * AUTOMATIC EDIT EVENT TRACKER
 * Detects manual changes on Status or Courier, logs historical changes, and triggers backend API synchronization.
 * @param {Object} e - Sheets event object.
 */
function onEdit(e) {
  if (!e) return;
  try {
    var range = e.range;
    var sheet = range.getSheet();
    if (sheet.getName() !== CONFIG.SHEETS.ORDERS) return;

    var row = range.getRow();
    var col = range.getColumn();
    if (row <= 1) return; // Ignore headers

    var orderId = sheet.getRange(row, 2).getValue().toString().trim();
    if (!orderId) return;

    var email = Session.getActiveUser().getEmail() || "Admin (Manual)";

    // Col 12: Payment Status, Col 13: Order Status, Col 23: Courier, Col 24: Tracking Num, Col 25: Tracking URL, Col 26: Notes
    var targetCols = [12, 13, 23, 24, 25, 26];
    var isTargetCol = targetCols.indexOf(col) !== -1;

    if (!isTargetCol) return;

    // Log history transitions if statuses are modified
    if (col === 13) { // Order Status
      var prevStatus = e.oldValue || "None";
      var newStatus = range.getValue().toString().trim();
      HistoryService.logOrderStatus(orderId, prevStatus, newStatus, email);
      AuditService.log("Manual Status Edit", orderId, "Status shifted from '" + prevStatus + "' to '" + newStatus + "' by " + email);
      
      // Auto trigger customer status update email in background
      try {
        var ordersData = sheet.getRange(row, 1, 1, CONFIG.HEADERS.ORDERS.length).getValues()[0];
        // Create order object mimic to build template
        var orderPayload = {
          orderId: orderId,
          customerName: ordersData[3],
          email: ordersData[5],
          subtotal: ordersData[18],
          deliveryCharge: ordersData[19],
          discount: ordersData[20],
          grandTotal: ordersData[21],
          products: ordersData[13],
          sizes: ordersData[14],
          colors: ordersData[15],
          courierName: ordersData[22],
          trackingNumber: ordersData[23],
          trackingUrl: ordersData[24]
        };
        EmailService.sendOrderStatusNotification(orderPayload, newStatus);
      } catch (err) {
        console.error("Non-fatal onEdit email dispatch error: " + err.toString());
      }

    } else if (col === 12) { // Payment Status
      var prevPay = e.oldValue || "None";
      var newPay = range.getValue().toString().trim();
      HistoryService.logPaymentStatus(orderId, prevPay, newPay, email);
      AuditService.log("Manual Payment Edit", orderId, "Payment shifted from '" + prevPay + "' to '" + newPay + "' by " + email);
    } else {
      AuditService.log("Manual Edit", orderId, "Row cell at Column " + col + " adjusted by " + email);
    }

    // Direct synchronous update to backend to maintain state alignment
    var ordersData = sheet.getRange(row, 1, 1, CONFIG.HEADERS.ORDERS.length).getValues()[0];
    var syncPayload = {
      orderId: orderId,
      orderStatus: ordersData[12],
      paymentStatus: ordersData[11],
      courierName: ordersData[22],
      trackingNumber: ordersData[23],
      trackingUrl: ordersData[24],
      notes: ordersData[25],
      updatedAt: new Date().toISOString()
    };

    WebhookService.syncStatusToBackend(syncPayload);
    
    // Refresh visual dashboard formatting
    refreshDashboard();

  } catch (err) {
    console.error("onEdit orchestrator exception: " + err.toString());
  }
}

/**
 * INTERACTIVE SELECTION EVENT TRIGGER
 * Automatically detects clicks on custom G5 Search / H5 Clear cell buttons.
 * @param {Object} e - Sheets selection event object.
 */
function onSelectionChange(e) {
  if (!e) return;
  try {
    var range = e.range;
    var sheet = range.getSheet();
    if (sheet.getName() !== CONFIG.SHEETS.DASHBOARD) return;

    var row = range.getRow();
    var col = range.getColumn();

    // Check click coordinates matching buttons
    DashboardService.handleSelectionTrigger(row, col);
  } catch (err) {
    console.error("onSelectionChange orchestrator exception: " + err.toString());
  }
}

/**
 * FULL SYSTEM SETUP
 * Orchestrates full structures initialization, header styles, and seeds configuration defaults.
 */
function initializeAllSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Initialize Dashboard View
    DashboardService.initializeDashboard();

    // 2. Initialize Core Sheet Ledgers
    this.ensureSheetExists(ss, CONFIG.SHEETS.ORDERS, CONFIG.HEADERS.ORDERS);
    this.ensureSheetExists(ss, CONFIG.SHEETS.PRODUCTS, CONFIG.HEADERS.PRODUCTS);
    this.ensureSheetExists(ss, CONFIG.SHEETS.CUSTOMERS, CONFIG.HEADERS.CUSTOMERS);
    this.ensureSheetExists(ss, CONFIG.SHEETS.ORDER_HISTORY, CONFIG.HEADERS.ORDER_HISTORY);
    this.ensureSheetExists(ss, CONFIG.SHEETS.PAYMENT_HISTORY, CONFIG.HEADERS.PAYMENT_HISTORY);
    this.ensureSheetExists(ss, CONFIG.SHEETS.AUDIT_LOG, CONFIG.HEADERS.AUDIT_LOG);

    // 3. Initialize Settings parameters
    SettingsService.initializeSettingsSheet(ss);

    // 4. Generate visual Reports
    ReportService.generateReportLedger();
    AnalyticsService.generateOperationalCharts();

    // 5. Apply pristine style designs to core ledgers
    OrderService.beautifyOrdersSheet(ss.getSheetByName(CONFIG.SHEETS.ORDERS));
    CustomerService.applyCustomerFormatting(ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS));
    ProductService.applyProductFormatting(ss.getSheetByName(CONFIG.SHEETS.PRODUCTS));

    AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Entire enterprise sheet database, dashboards, and settings initialized successfully.");
  } catch (err) {
    console.error("System initialization exception: " + err.toString());
  }
}

/**
 * Sheet existence validator helper.
 */
function ensureSheetExists(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    
    // Style headers
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground(CONFIG.THEME.PRIMARY_DARK)
      .setFontColor(CONFIG.THEME.TEXT_LIGHT)
      .setFontWeight("bold")
      .setFontFamily("Inter");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

/**
 * FAST MANUAL OR BACKGROUND STATS REFRESH
 */
function refreshDashboard() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
    
    if (ordersSheet) {
      OrderService.beautifyOrdersSheet(ordersSheet);
    }
    
    OrderService.updateDependentMetrics();
    
    PropertiesService.getScriptProperties().setProperty(CONFIG.PROPERTIES_KEYS.LAST_DASHBOARD_REFRESH, new Date().getTime().toString());
    console.log("Dashboard refreshed and metrics synchronized.");
  } catch (e) {
    console.error("Error refreshing dashboard: " + e.toString());
  }
}

/**
 * SCHEDULED 5-MINUTE RE-RUN ENTERPOINT
 * Flushes pending failed status synchronizations and pending emails.
 */
function runEvery5Minutes() {
  console.log("Scheduled flusher triggered...");
  WebhookService.processFailedSyncQueue();
  EmailService.processFailedEmailQueue();
}

/**
 * INSTANT SCHEDULE CREATION
 */
function createTimeDrivenTriggers() {
  TriggerService.setupAutomatedCronTriggers();
  SpreadsheetApp.getUi().alert("ROY MEN Engine", "Automated background trigger crons installed successfully.", SpreadsheetApp.getUi().ButtonSet.OK);
}

// Redirect wrapper handles for manual Custom Menu events
function exportPdfReport() { ExportService.exportPdfReport(); }
function exportCsvOrders() { ExportService.exportCsvOrders(); }
function exportExcelWorksheet() { ExportService.exportExcelWorksheet(); }
function backupOrdersLedger() { ExportService.backupOrdersLedger(); }
function recalculateCatalogAndAnalytics() { OrderService.updateDependentMetrics(); }
