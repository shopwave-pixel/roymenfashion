/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: Templates.gs
 * ROLE: "Quiet Luxury" Visual Identity Responsive HTML Email Builder
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var Templates = {
  /**
   * Primary wrapper that applies the premium Quiet Luxury layout surrounding any content block.
   * @param {string} title - Main header/subject of the email.
   * @param {string} bodyHtml - Main content block styled with standard HTML.
   * @return {string} A fully consolidated, responsive HTML email.
   */
  getWrapper: function(title, bodyHtml) {
    return (
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '  <meta charset="utf-8">' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '  <title>' + title + '</title>' +
      '  <style>' +
      '    body { font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif; background-color: #F9F9F9; margin: 0; padding: 0; color: #1A1A1A; -webkit-font-smoothing: antialiased; }' +
      '    .wrapper { width: 100%; table-layout: fixed; background-color: #F9F9F9; padding: 40px 0; }' +
      '    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAEAEA; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }' +
      '    .header { background-color: #0F0F0F; padding: 40px; text-align: center; border-bottom: 3px solid #C5A880; }' +
      '    .header h1 { color: #FFFFFF; font-size: 24px; font-weight: 500; letter-spacing: 4px; margin: 0; text-transform: uppercase; }' +
      '    .content { padding: 48px 40px; line-height: 1.6; font-size: 15px; color: #333333; }' +
      '    .content h2 { font-size: 18px; font-weight: 500; letter-spacing: 1px; color: #0F0F0F; margin-top: 0; margin-bottom: 24px; text-transform: uppercase; border-bottom: 1px solid #EAEAEA; padding-bottom: 8px; }' +
      '    .content p { margin: 0 0 16px 0; }' +
      '    .button-container { text-align: center; margin: 32px 0; }' +
      '    .button { display: inline-block; background-color: #0F0F0F; color: #FFFFFF !important; text-decoration: none; padding: 14px 36px; font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; border: 1px solid #0F0F0F; transition: all 0.2s ease; }' +
      '    .button:hover { background-color: #FFFFFF; color: #0F0F0F !important; }' +
      '    .invoice-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }' +
      '    .invoice-table th { text-align: left; padding: 12px; border-bottom: 1px solid #0F0F0F; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }' +
      '    .invoice-table td { padding: 12px; border-bottom: 1px solid #F0F0F0; }' +
      '    .invoice-table .total-row td { border-top: 1px solid #0F0F0F; border-bottom: none; font-weight: 600; font-size: 15px; }' +
      '    .footer { background-color: #F9F9F9; padding: 32px 40px; text-align: center; border-top: 1px solid #EAEAEA; font-size: 11px; color: #767676; letter-spacing: 1px; line-height: 1.8; }' +
      '    .footer a { color: #0F0F0F; text-decoration: none; font-weight: 500; }' +
      '    .status-badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px; }' +
      '  </style>' +
      '</head>' +
      '<body>' +
      '  <div class="wrapper">' +
      '    <table class="container" cellpadding="0" cellspacing="0" border="0">' +
      '      <tr>' +
      '        <td class="header">' +
      '          <h1>ROY MEN</h1>' +
      '          <div style="color: #C5A880; font-size: 10px; letter-spacing: 2px; margin-top: 8px; text-transform: uppercase;">Dhaka &bull; London</div>' +
      '        </td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td class="content">' +
      '          ' + bodyHtml +
      '        </td>' +
      '      </tr>' +
      '      <tr>' +
      '        <td class="footer">' +
      '          This is an automated communication regarding your interaction with the ROY MEN online store.<br>' +
      '          &copy; ' + new Date().getFullYear() + ' ROY MEN Bangladesh. All rights reserved.<br>' +
      '          Need assistance? Contact our digital concierge at <a href="mailto:concierge@roymen.com">concierge@roymen.com</a>' +
      '        </td>' +
      '      </tr>' +
      '    </table>' +
      '  </div>' +
      '</body>' +
      '</html>'
    );
  },

  /**
   * Generates a receipt HTML invoice table for inclusion in emails.
   * @param {Object} p - The order object payload.
   * @return {string} HTML table content string.
   */
  buildInvoiceTable: function(p) {
    var items = p.products ? p.products.split(/[,;\n]+/) : ["Standard Product"];
    var sizes = p.sizes ? p.sizes.split(/[,;\n]+/) : ["N/A"];
    var colors = p.colors ? p.colors.split(/[,;\n]+/) : ["N/A"];
    
    var rowsHtml = "";
    var subtotal = Number(p.subtotal) || 0;
    var shipping = Number(p.deliveryCharge) || 0;
    var discount = Number(p.discount) || 0;
    var grandTotal = Number(p.grandTotal) || (subtotal + shipping - discount);

    for (var i = 0; i < items.length; i++) {
      var name = items[i] || "Item";
      var size = sizes[i] || "Standard";
      var color = colors[i] || "Standard";
      rowsHtml += (
        '<tr>' +
        '  <td>' +
        '    <div style="font-weight: 500; color: #0F0F0F;">' + name + '</div>' +
        '    <div style="font-size: 12px; color: #767676; margin-top: 2px;">Size: ' + size + ' &bull; Color: ' + color + '</div>' +
        '  </td>' +
        '  <td style="text-align: right; vertical-align: middle;">1</td>' +
        '</tr>'
      );
    }

    return (
      '<table class="invoice-table">' +
      '  <thead>' +
      '    <tr>' +
      '      <th style="width: 70%;">Item Description</th>' +
      '      <th style="width: 30%; text-align: right;">Qty</th>' +
      '    </tr>' +
      '  </thead>' +
      '  <tbody>' +
      '    ' + rowsHtml +
      '    <tr style="border-top: 1px solid #EAEAEA;">' +
      '      <td style="text-align: right; color: #767676; padding: 8px 12px 4px 12px;">Subtotal</td>' +
      '      <td style="text-align: right; font-weight: 500; padding: 8px 12px 4px 12px;">৳' + Math.round(subtotal) + '</td>' +
      '    </tr>' +
      '    <tr>' +
      '      <td style="text-align: right; color: #767676; padding: 4px 12px;">Delivery Charge</td>' +
      '      <td style="text-align: right; font-weight: 500; padding: 4px 12px;">৳' + Math.round(shipping) + '</td>' +
      '    </tr>' +
      '    ' + (discount > 0 ? (
      '    <tr>' +
      '      <td style="text-align: right; color: #902020; padding: 4px 12px;">Discount Applied</td>' +
      '      <td style="text-align: right; color: #902020; font-weight: 500; padding: 4px 12px;">-৳' + Math.round(discount) + '</td>' +
      '    </tr>') : '') +
      '    <tr class="total-row">' +
      '      <td style="text-align: right; padding-top: 12px;">Grand Total</td>' +
      '      <td style="text-align: right; color: #0F0F0F; padding-top: 12px;">৳' + Math.round(grandTotal) + '</td>' +
      '    </tr>' +
      '  </tbody>' +
      '</table>'
    );
  },

  /**
   * Compiles the welcome template.
   */
  getWelcome: function(customerName) {
    var body = (
      '<h2>Welcome to ROY MEN</h2>' +
      '<p>Dear ' + customerName + ',</p>' +
      '<p>Thank you for expressing interest in ROY MEN. We are honored to welcome you into our select collective of clients who appreciate timeless, structured elegance.</p>' +
      '<p>Your account is now registered. As a member of our digital concierge portal, you will be granted early priority access to our upcoming seasonal collections and premium services.</p>' +
      '<p>We invite you to explore our world and experience true craftsmanship.</p>' +
      '<div class="button-container">' +
      '  <a href="https://roymen.com" class="button" target="_blank">Enter Studio</a>' +
      '</div>'
    );
    return this.getWrapper("Welcome to ROY MEN", body);
  },

  /**
   * Compiles an OTP verification template.
   */
  getOtp: function(otpCode) {
    var body = (
      '<h2>Security Access Code</h2>' +
      '<p>A secure access request was registered from your terminal. Please use the following one-time password (OTP) verification code to authenticate your login.</p>' +
      '<div style="text-align: center; margin: 32px 0; background-color: #F5F5F5; border-left: 4px solid #C5A880; padding: 20px;">' +
      '  <span style="font-family: \'Courier New\', Courier, monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0F0F0F;">' + otpCode + '</span>' +
      '</div>' +
      '<p style="font-size: 12px; color: #767676;">This authorization code is strictly valid for the next 5 minutes. If you did not initiate this validation request, please contact our security team immediately.</p>'
    );
    return this.getWrapper("Secure Passcode", body);
  },

  /**
   * Compiles order status updates template based on target status.
   */
  getOrderStatusEmail: function(p, status) {
    var title = "Order Update";
    var trackingText = "";
    var messageText = "";

    // Set custom messages matching status
    switch (status) {
      case "Pending":
        title = "Order Confirmed";
        messageText = "Your order has been registered in our ledger. Our studio associates are checking items to verify quality standards.";
        break;
      case "Confirmed":
        title = "Order Verified";
        messageText = "Your purchase transaction has been confirmed. Your items have been allocated and marked for packaging.";
        break;
      case "Processing":
        title = "Processing Initiated";
        messageText = "Your selection is currently entering our premium manufacturing/preparation queue. Tailoring, stitching, and finishing processes are underway.";
        break;
      case "Packed":
        title = "Parcel Sealed";
        messageText = "Quality checks are complete. Your item has been wrapped and sealed in our bespoke minimal packaging, ready for distribution.";
        break;
      case "Shipped":
        title = "In Transit";
        messageText = "Your shipment has been dispatched. A courier concierge is routing the parcel to your delivery address.";
        if (p.trackingNumber) {
          trackingText = (
            '<div style="margin: 24px 0; padding: 20px; background-color: #FAF5EF; border: 1px solid #EAEAEA;">' +
            '  <div style="font-size: 11px; text-transform: uppercase; color: #767676; letter-spacing: 1px;">Courier Partner</div>' +
            '  <div style="font-size: 15px; font-weight: 500; color: #0F0F0F; margin-top: 4px;">' + (p.courierName || "Local Delivery Partner") + '</div>' +
            '  <div style="font-size: 11px; text-transform: uppercase; color: #767676; letter-spacing: 1px; margin-top: 12px;">Tracking Number</div>' +
            '  <div style="font-size: 14px; font-family: monospace; color: #0F0F0F; margin-top: 4px;">' + p.trackingNumber + '</div>' +
            '</div>' +
            (p.trackingUrl ? (
            '<div class="button-container">' +
            '  <a href="' + p.trackingUrl + '" class="button" target="_blank">Track Shipment</a>' +
            '</div>') : '')
          );
        }
        break;
      case "Delivered":
        title = "Delivered";
        messageText = "Our courier concierge reports that your package was delivered successfully. We hope your selection meets your highest standards.";
        break;
      case "Cancelled":
        title = "Order Cancelled";
        messageText = "Your order has been cancelled and removed from active fulfillment. If any charges were processed, a refund will automatically follow shortly.";
        break;
      default:
        messageText = "Your order status was updated to " + status + ".";
    }

    var body = (
      '<h2>' + title + '</h2>' +
      '<p>Dear ' + p.customerName + ',</p>' +
      '<p>We are writing to update you on your order <strong style="font-family: monospace; color: #0F0F0F;">#' + p.orderId + '</strong>.</p>' +
      '<p>' + messageText + '</p>' +
      '  <span class="status-badge" style="background-color: ' + CONFIG.THEME.STATUS[status.toUpperCase()].BG + '; color: ' + CONFIG.THEME.STATUS[status.toUpperCase()].TEXT + ';">Status: ' + status + '</span>' +
      '  ' + trackingText +
      '  <h3 style="margin-top: 32px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0F0F0F;">Summary of Purchase</h3>' +
      '  ' + this.buildInvoiceTable(p)
    );

    return this.getWrapper(title + " #" + p.orderId, body);
  },

  /**
   * Compiles administration notification template.
   */
  getAdminNotification: function(p) {
    var body = (
      '<h2>[ADMIN] New Order Logged</h2>' +
      '<p>An order was received from the Railway web app server. Details have been safely logged into the active Google Sheets Database.</p>' +
      '<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold; width: 35%;">Order ID</td><td style="padding: 6px 0; font-family: monospace;">' + p.orderId + '</td></tr>' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold;">Client Name</td><td style="padding: 6px 0;">' + p.customerName + '</td></tr>' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold;">Phone</td><td style="padding: 6px 0;">' + p.phone + '</td></tr>' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold;">Email</td><td style="padding: 6px 0;">' + p.email + '</td></tr>' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold;">Grand Total</td><td style="padding: 6px 0; font-weight: bold;">৳' + p.grandTotal + '</td></tr>' +
      '  <tr><td style="padding: 6px 0; color: #767676; font-weight: bold;">Method</td><td style="padding: 6px 0;">' + p.paymentMethod + '</td></tr>' +
      '</table>' +
      '<div class="button-container">' +
      '  <a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" class="button" target="_blank">Open Sheets Ledger</a>' +
      '</div>'
    );
    return this.getWrapper("New Order Alert", body);
  }
};
