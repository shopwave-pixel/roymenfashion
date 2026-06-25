/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: ExportService.gs
 * ROLE: Ledger Backups, PDF Generators & CSV/Excel Data Exporter
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var ExportService = {
  /**
   * Generates a beautifully-formatted PDF export of the active reports sheet.
   * Prompts the user with a direct web link to download.
   */
  exportPdfReport: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.REPORTS);
      if (!sheet) return;

      var url = ss.getUrl().replace(/edit$/, "") + "export?";
      var exportOptions = {
        exportFormat: "pdf",
        format: "pdf",
        size: "LETTER",
        portrait: "true",
        fitw: "true",
        gridlines: "false",
        printtitle: "false",
        sheetnames: "false",
        fzr: "false",
        gid: sheet.getSheetId().toString()
      };

      var queryParts = [];
      for (var key in exportOptions) {
        queryParts.push(key + "=" + exportOptions[key]);
      }
      var downloadUrl = url + queryParts.join("&");

      var htmlOutput = HtmlService.createHtmlOutput(
        '<p style="font-family: \'Inter\', sans-serif; font-size: 14px; color: #333;">Your PDF report compilation is complete. Please click below to download:</p>' +
        '<div style="text-align: center; margin: 24px 0;">' +
        '  <a href="' + downloadUrl + '" target="_blank" style="background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; padding: 12px 30px; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;">Download PDF</a>' +
        '</div>'
      ).setWidth(400).setHeight(150);

      SpreadsheetApp.getUi().showModalDialog(htmlOutput, "ROY MEN PDF Export");
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Exported PDF report file.");
    } catch (e) {
      console.error("PDF export error: " + e.toString());
      SpreadsheetApp.getUi().alert("Export Failed: " + e.toString());
    }
  },

  /**
   * Generates a downloadable CSV text string of the primary Orders sheet.
   */
  exportCsvOrders: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!sheet) return;

      var data = sheet.getDataRange().getValues();
      var csvContent = "";

      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var escapedFields = [];
        for (var j = 0; j < row.length; j++) {
          var field = row[j] ? row[j].toString() : "";
          // Escape quotes and commas
          if (field.indexOf(",") !== -1 || field.indexOf('"') !== -1 || field.indexOf("\n") !== -1) {
            field = '"' + field.replace(/"/g, '""') + '"';
          }
          escapedFields.push(field);
        }
        csvContent += escapedFields.join(",") + "\r\n";
      }

      var blob = Utilities.newBlob(csvContent, "text/csv", "ROY_MEN_Orders_" + Utils.formatDateTimeInDhaka(new Date()).substring(0, 10) + ".csv");
      var fileUrl = DriveApp.createFile(blob).getDownloadUrl();

      var htmlOutput = HtmlService.createHtmlOutput(
        '<p style="font-family: \'Inter\', sans-serif; font-size: 14px; color: #333;">Your CSV order ledger export is complete. Click below to download:</p>' +
        '<div style="text-align: center; margin: 24px 0;">' +
        '  <a href="' + fileUrl + '" target="_blank" style="background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; padding: 12px 30px; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;">Download CSV</a>' +
        '</div>'
      ).setWidth(400).setHeight(150);

      SpreadsheetApp.getUi().showModalDialog(htmlOutput, "ROY MEN CSV Export");
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Exported CSV ledger file.");
    } catch (e) {
      console.error("CSV export error: " + e.toString());
      SpreadsheetApp.getUi().alert("Export Failed: " + e.toString());
    }
  },

  /**
   * Provides direct download URL of entire Google Sheets converted to MS Excel .xlsx.
   */
  exportExcelWorksheet: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var url = ss.getUrl().replace(/edit$/, "") + "export?format=xlsx";

      var htmlOutput = HtmlService.createHtmlOutput(
        '<p style="font-family: \'Inter\', sans-serif; font-size: 14px; color: #333;">Your entire Google Worksheet converted to MS Excel format is ready:</p>' +
        '<div style="text-align: center; margin: 24px 0;">' +
        '  <a href="' + url + '" target="_blank" style="background-color: #0F0F0F; color: #FFFFFF; text-decoration: none; padding: 12px 30px; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;">Download Excel (.xlsx)</a>' +
        '</div>'
      ).setWidth(400).setHeight(150);

      SpreadsheetApp.getUi().showModalDialog(htmlOutput, "ROY MEN Excel Export");
      AuditService.log(CONFIG.LOGGING.LEVELS.INFO, null, "Exported XLSX workbooks.");
    } catch (e) {
      console.error("Excel export error: " + e.toString());
    }
  },

  /**
   * Backs up the primary sales sheet to a safe folder in Google Drive.
   * Auto cleans historical backups older than retention configuration (CONFIG.BACKUP.MAX_FILES).
   */
  backupOrdersLedger: function() {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS);
      if (!ordersSheet) return;

      // Find or create back-up repository
      var folderIterator = DriveApp.getFoldersByName(CONFIG.BACKUP.FOLDER_NAME);
      var folder;
      if (folderIterator.hasNext()) {
        folder = folderIterator.next();
      } else {
        folder = DriveApp.createFolder(CONFIG.BACKUP.FOLDER_NAME);
      }

      // Convert Sheet Data to CSV blob
      var data = ordersSheet.getDataRange().getValues();
      var csvContent = "";
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var escapedFields = [];
        for (var j = 0; j < row.length; j++) {
          var field = row[j] ? row[j].toString() : "";
          if (field.indexOf(",") !== -1 || field.indexOf('"') !== -1 || field.indexOf("\n") !== -1) {
            field = '"' + field.replace(/"/g, '""') + '"';
          }
          escapedFields.push(field);
        }
        csvContent += escapedFields.join(",") + "\r\n";
      }

      var fileName = "ROY_MEN_Backup_Orders_" + Utils.formatDateTimeInDhaka(new Date()).replace(/[\s:]/g, "_") + ".csv";
      var blob = Utilities.newBlob(csvContent, "text/csv", fileName);
      folder.createFile(blob);

      // Save backup status property
      PropertiesService.getScriptProperties().setProperty(CONFIG.PROPERTIES_KEYS.LAST_BACKUP, new Date().getTime().toString());

      // Clean oldest files to respect quotas
      var fileIterator = folder.getFiles();
      var backupsList = [];
      while (fileIterator.hasNext()) {
        backupsList.push(fileIterator.next());
      }

      if (backupsList.length > CONFIG.BACKUP.MAX_FILES) {
        // Sort files by creation date ascending (oldest first)
        backupsList.sort(function(a, b) {
          return a.getDateCreated() - b.getDateCreated();
        });

        var toDeleteCount = backupsList.length - CONFIG.BACKUP.MAX_FILES;
        for (var k = 0; k < toDeleteCount; k++) {
          backupsList[k].setTrashed(true);
        }
        
        AuditService.log(
          CONFIG.LOGGING.LEVELS.INFO,
          null,
          "Daily backup cycle processed. Cleaned " + toDeleteCount + " old backup files."
        );
      } else {
        AuditService.log(
          CONFIG.LOGGING.LEVELS.INFO,
          null,
          "Daily backup created successfully: '" + fileName + "'"
        );
      }
    } catch (e) {
      console.error("Backup creation failed: " + e.toString());
      AuditService.log(CONFIG.LOGGING.LEVELS.ERROR, null, "Cold backup failure: " + e.toString());
    }
  }
};
