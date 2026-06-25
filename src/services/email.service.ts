import nodemailer from 'nodemailer';
import dns from 'dns';

// Fully typed interface for SMTP Configuration
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

// 8. Add startup logging that prints variables without exposing EMAIL_PASS
console.log('==================================================================');
console.log('[ROYMEN SMTP STARTUP] DIAGNOSTICS & CONFIGURATION INITIALIZED:');
console.log(`- EMAIL_HOST: ${process.env.EMAIL_HOST || 'smtp.gmail.com (Default)'}`);
console.log(`- EMAIL_PORT: ${process.env.EMAIL_PORT || '587 (Default)'}`);
console.log(`- EMAIL_USER: ${process.env.EMAIL_USER || 'Not Configured'}`);
console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not Configured'}`);
console.log(`- ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'Not Configured'}`);
console.log(`- EMAIL_PASS configured: ${process.env.EMAIL_PASS ? 'YES (VALUE HIDDEN)' : 'NO'}`);
console.log('==================================================================');

// Lazy initializer for Nodemailer transporter to prevent crashes on startup if env variables are empty
let transporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || user || '';

    if (!user || !pass) {
      console.warn('[ROYMEN Email] Warning: EMAIL_USER and EMAIL_PASS are not configured. Emails will log to terminal fallback only.');
    }

    // 4. Verify host, port, secure, auth, connectionTimeout, greetingTimeout, socketTimeout, TLS settings
    // 5. Port 587 uses secure:false, 6. Port 465 uses secure:true
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // True for 465, false for 587 (using STARTTLS)
      auth: {
        user: user || '',
        pass: pass || ''
      },
      connectionTimeout: 15000, // 15 seconds connection timeout
      greetingTimeout: 15000,   // 15 seconds greeting timeout
      socketTimeout: 30000,     // 30 seconds socket timeout
      tls: {
        rejectUnauthorized: false, // Prevents issues with self-signed certs in sandboxes
        minVersion: 'TLSv1.2'      // Enforce modern secure TLS version
      },
      // Force IPv4 DNS resolution to prevent IPv6 ENETUNREACH errors on platforms like Railway
      lookup: (hostname: string, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        const dnsOpts = typeof options === 'object' && options !== null ? { ...options, family: 4 } : { family: 4 };
        dns.lookup(hostname, dnsOpts, callback);
      }
    } as any);
  }
  return transporter;
};

/**
 * 10. Verify SMTP connection directly using verifySmtpConnection helper
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: any }> {
  try {
    const activeTransporter = getTransporter();
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const missingErr = new Error('EMAIL_USER or EMAIL_PASS environment variable is missing.');
      console.error('[ROYMEN SMTP Pre-Verification] Failed: Credentials not configured.');
      return { 
        success: false, 
        error: missingErr
      };
    }
    console.log('[ROYMEN SMTP Pre-Verification] Executing transporter.verify()...');
    
    try {
      await activeTransporter.verify();
    } catch (verifyErr: any) {
      console.error('[ROYMEN SMTP Verify Error Caught via activeTransporter.verify()]');
      console.error(verifyErr); // Log complete error object
      throw verifyErr;
    }
    
    console.log('[ROYMEN SMTP Pre-Verification] SMTP connection verified successfully (transporter.verify() passed).');
    return { success: true };
  } catch (error: any) {
    console.error('[ROYMEN SMTP Pre-Verification] Failed with error:', error.message || error);
    console.error(error); // Log complete error object
    if (error) {
      console.error('=================== DETAILED SMTP VERIFY EXCEPTION ===================');
      console.error(`- ERROR MESSAGE:  ${error.message || 'N/A'}`);
      console.error(`- SMTP CODE:      ${error.code || 'N/A'}`);
      console.error(`- COMMAND:        ${error.command || 'N/A'}`);
      console.error(`- RESPONSE:       ${error.response || 'N/A'}`);
      console.error(`- RESPONSE CODE:  ${error.responseCode || 'N/A'}`);
      console.error(`- ERRNO:          ${error.errno || 'N/A'}`);
      console.error(`- SYSCALL:        ${error.syscall || 'N/A'}`);
      console.error(`- ADDRESS:        ${error.address || 'N/A'}`);
      console.error(`- PORT:           ${error.port || 'N/A'}`);
      console.error(`- STACKTRACE:\n${error.stack || 'N/A'}`);
      console.error('======================================================================');
    }
    return { success: false, error };
  }
}

/**
 * Reusable core function to dispatch an email.
 * Always handles errors gracefully to avoid breaking checkout or auth flows.
 */
export async function sendEmail(to: string, subject: string, html: string, throwOnError?: boolean): Promise<boolean> {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'ROY MEN <noreply@roymen.com>';
  try {
    const activeTransporter = getTransporter();
    
    // If we have no credentials, do a high-performance terminal mock to avoid timing out
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`\n========================================`);
      console.log(`[ROYMEN EMAIL MOCK] To: ${to}`);
      console.log(`[ROYMEN EMAIL MOCK] Subject: ${subject}`);
      console.log(`[ROYMEN EMAIL MOCK] Body length: ${html.length} chars`);
      console.log(`========================================\n`);
      return true;
    }

    // 10. Add transporter.verify() before sending emails
    console.log(`[ROYMEN Email] Active verification of SMTP routing connection to dispatch to: ${to}...`);
    const verification = await verifySmtpConnection();
    if (!verification.success) {
      throw verification.error || new Error('SMTP pre-verification check failed.');
    }

    try {
      await activeTransporter.sendMail({
        from,
        to,
        subject,
        html
      });
    } catch (sendErr: any) {
      console.error('[ROYMEN SMTP sendMail Error Caught via activeTransporter.sendMail()]');
      console.error(sendErr); // Log complete error object
      throw sendErr;
    }
    
    console.log(`[ROYMEN Email] Dispatched successfully to: ${to} | Subject: ${subject}`);
    return true;
  } catch (error: any) {
    console.error(`[ROYMEN Email Error] Failed sending email to ${to}:`, error.message || error);
    console.error(error); // Log complete error object
    
    // 11. Improve error logging to display: message, code, command, response, responseCode, errno, syscall, address, port, stack
    if (error) {
      console.error('=================== DETAILED SMTP DIAGNOSTIC EXCEPTION ===================');
      console.error(`- ERROR MESSAGE:  ${error.message || 'N/A'}`);
      console.error(`- SMTP CODE:      ${error.code || 'N/A'}`);
      console.error(`- COMMAND:        ${error.command || 'N/A'}`);
      console.error(`- RESPONSE:       ${error.response || 'N/A'}`);
      console.error(`- RESPONSE CODE:  ${error.responseCode || 'N/A'}`);
      console.error(`- ERRNO:          ${error.errno || 'N/A'}`);
      console.error(`- SYSCALL:        ${error.syscall || 'N/A'}`);
      console.error(`- ADDRESS:        ${error.address || 'N/A'}`);
      console.error(`- PORT:           ${error.port || 'N/A'}`);
      console.error(`- STACKTRACE:\n${error.stack || 'N/A'}`);
      console.error('==========================================================================');
    }
    
    if (throwOnError) {
      throw error;
    }
    return false;
  }
}

// ------------------------------------------------------------------
// LUXURY BLACK & WHITE RESPONSIVE HTML EMAIL TEMPLATES
// ------------------------------------------------------------------

const LUXURY_HEADER = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROY MEN</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #fafafa;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #fafafa;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #eaeaea;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #000000;
      color: #ffffff;
      text-align: center;
      padding: 30px 20px;
      border-bottom: 3px solid #d4af37; /* Gold Trim */
    }
    .logo-text {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.25em;
      margin: 0;
    }
    .logo-sub {
      font-size: 8px;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-top: 6px;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #000000;
      color: #a1a1aa;
      text-align: center;
      padding: 30px 20px;
      font-size: 11px;
      border-top: 1px solid #1a1a1a;
    }
    .btn {
      display: inline-block;
      background-color: #000000;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      border-radius: 2px;
      margin: 20px 0;
    }
    .btn:hover {
      background-color: #1c1c1e;
    }
    h1, h2, h3 {
      font-family: Georgia, serif;
      font-weight: normal;
      color: #000000;
      margin-top: 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #444444;
    }
    .divider {
      height: 1px;
      background-color: #eaeaea;
      margin: 25px 0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .meta-table td {
      padding: 8px 0;
      font-size: 13px;
      color: #555555;
    }
    .meta-table td.label {
      font-weight: bold;
      color: #111111;
      width: 150px;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.1em;
    }
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .order-table th {
      background-color: #f5f5f5;
      text-align: left;
      padding: 10px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #111111;
      border-bottom: 1px solid #eaeaea;
    }
    .order-table td {
      padding: 12px 10px;
      font-size: 13px;
      border-bottom: 1px solid #eaeaea;
      color: #333333;
    }
    .text-right {
      text-align: right;
    }
    .font-mono {
      font-family: 'Courier New', Courier, monospace;
    }
    .highlight-gold {
      color: #c5a059;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">ROY MEN</div>
        <div class="logo-sub">WEAR CONFIDENCE</div>
      </div>
      <div class="content">
`;

const LUXURY_FOOTER = `
      </div>
      <div class="footer">
        <p style="color: #ffffff; font-weight: bold; margin-bottom: 5px; font-size: 12px; letter-spacing: 0.1em;">ROY MEN BANGLADESH</p>
        <p style="margin: 0 0 15px 0; color: #71717a;">Curated Luxury Menswear • Dhaka, Bangladesh</p>
        <p style="margin: 0; font-size: 10px; color: #52525b;">© ${new Date().getFullYear()} ROY MEN. All Rights Reserved. Engineered for Excellence.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// 1. Welcome Email
export function getWelcomeEmailTemplate(name: string): string {
  return `
    ${LUXURY_HEADER}
    <h3>WELCOME TO THE COVENANT OF CONFIDENCE</h3>
    <p>Honorable ${name},</p>
    <p>Thank you for initiating your customer dossier with <strong>ROY MEN</strong>. We are honored to welcome you into an exclusive circle of patrons who value substance, proportion, and meticulous craftsmanship.</p>
    <p>Established with a singular focus, ROY MEN replaces generic disposable apparel with quiet, thoughtful luxury. Our tailoring is engineered precisely for local silhouettes, choosing only high-end global fabrics to ensure that whenever you dress, you represent absolute confidence.</p>
    <p>Your client account is now verified and active. You may log in at any time to monitor bespoke commissions, access your wishlist, and experience the premium curation of our seasonal capsule collections.</p>
    <p>If you have any inquiries regarding your client profile or require bespoke sartorial assistance, our executive concierge desk is always at your service at <strong style="color: #c5a059;">roymenbusiness@gmail.com</strong>.</p>
    <div class="divider"></div>
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'https://roymen.com'}/#/shop" class="btn">Discover the Collection</a>
    </div>
    ${LUXURY_FOOTER}
  `;
}

// 2. Forgot Password Reset Link Email
export function getForgotPasswordEmailTemplate(name: string, resetLink: string): string {
  return `
    ${LUXURY_HEADER}
    <h3>ACCOUNT RECOVERY PROTOCOL</h3>
    <p>Dear ${name},</p>
    <p>We received an official request to reset the password associated with your ROY MEN customer profile.</p>
    <p>To establish a new security code, please click the authentication button below. This recovery window is strictly secure and will self-expire in <strong>15 minutes</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" class="btn" style="background-color: #d4af37; color: #000000 !important;">Reset Password</a>
    </div>
    <p>If you did not initiate this security query, please disregard this email or contact our support concierge immediately to secure your client portal.</p>
    <div class="divider"></div>
    <p style="font-size: 11px; color: #777777;">Reset link url: <br/><a href="${resetLink}" style="color: #c5a059;">${resetLink}</a></p>
    ${LUXURY_FOOTER}
  `;
}

// 3. Password Changed Success Email
export function getPasswordChangedEmailTemplate(name: string): string {
  return `
    ${LUXURY_HEADER}
    <h3>SECURITY LEDGER CONFIRMED</h3>
    <p>Dear ${name},</p>
    <p>This communication confirms that the password for your <strong>ROY MEN</strong> customer profile has been successfully updated.</p>
    <p>If this adjustment was executed by you, no further operations are required. Your account is secure.</p>
    <p>If you did not authorize this password revision, please act immediately by contacting our executive helpdesk at <strong style="color: #000000;">roymenbusiness@gmail.com</strong> to halt any unauthorized access.</p>
    <div class="divider"></div>
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'https://roymen.com'}/#/login" class="btn">Login to Portal</a>
    </div>
    ${LUXURY_FOOTER}
  `;
}

// Helper to render product rows for emails
function renderProductRows(items: any[]): string {
  return items.map(item => `
    <tr>
      <td>
        <strong style="color:#000;">${item.name}</strong><br/>
        <span style="font-size:11px; color:#666;">Size: ${item.size || 'Standard'} | Color: ${item.color || 'Standard'}</span>
      </td>
      <td class="font-mono">${item.sku || 'N/A'}</td>
      <td class="text-right">${item.quantity}</td>
      <td class="text-right font-mono">৳${item.price.toLocaleString()}</td>
      <td class="text-right font-mono" style="font-weight:bold;">৳${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');
}

// 4. Customer Order Confirmation Email
export function getCustomerOrderConfirmationTemplate(order: any): string {
  const billing = order.billingDetails;
  return `
    ${LUXURY_HEADER}
    <h3>THANK YOU FOR YOUR BESPOKE COMMISSION</h3>
    <p>Dear ${billing.name},</p>
    <p>Your premium sartorial requisition has been successfully logged. Our tailoring coordinators in Mohammadpur, Dhaka are preparing your selection with impeccable care.</p>
    
    <div class="divider"></div>
    <h4>ORDER RECEIPT: <span class="font-mono highlight-gold">${order.id}</span></h4>
    
    <table class="meta-table">
      <tr>
        <td class="label">Date Ordered:</td>
        <td class="font-mono">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      </tr>
      <tr>
        <td class="label">Delivery Coordinates:</td>
        <td>${billing.address}, ${billing.district} (${billing.postalCode || 'N/A'})</td>
      </tr>
      <tr>
        <td class="label">Contact Line:</td>
        <td class="font-mono">+88${billing.phone}</td>
      </tr>
      <tr>
        <td class="label">Settlement Mode:</td>
        <td><strong>${order.paymentMethod.toUpperCase()}</strong></td>
      </tr>
      <tr>
        <td class="label">Fulfillment Status:</td>
        <td><span style="background-color: #000; color: #fff; padding: 2px 8px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${order.orderStatus}</span></td>
      </tr>
    </table>

    <h4>ACQUIRED ATTIRE</h4>
    <table class="order-table">
      <thead>
        <tr>
          <th>Sartorial Style</th>
          <th>SKU</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${renderProductRows(order.items)}
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:bold; font-size:12px;">Subtotal:</td>
          <td class="text-right font-mono" style="border-bottom: 1px solid #eaeaea;">৳${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:bold; font-size:12px;">Delivery:</td>
          <td class="text-right font-mono" style="border-bottom: 1px solid #eaeaea;">৳${order.deliveryFee.toLocaleString()}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right highlight-gold" style="font-weight:bold; font-size:12px;">Discount:</td>
          <td class="text-right font-mono highlight-gold" style="border-bottom: 1px solid #eaeaea;">-৳${order.discount.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:900; font-size:14px; text-transform:uppercase;">Grand Total:</td>
          <td class="text-right font-mono" style="font-weight:900; font-size:15px; border-bottom: 2px double #000;">৳${order.total.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="divider"></div>
    <p><strong>Expected Dispatch Time:</strong> Orders are verified and dispatched from our local distribution node within 12-24 hours. Delivery inside Dhaka takes 24-48 hours; national transit is resolved within 3-5 days.</p>
    <p>For instant tracking updates, input your order key <strong class="font-mono">${order.id}</strong> on our tracking registry.</p>
    ${LUXURY_FOOTER}
  `;
}

// 5. Admin Order Notification Email
export function getAdminOrderNotificationTemplate(order: any, ip: string = 'N/A', userAgent: string = 'N/A'): string {
  const billing = order.billingDetails;
  return `
    ${LUXURY_HEADER}
    <h3 style="color:#d4af37;">🔔 NEW BESPOKE ORDER RECIEVED</h3>
    <p>An elite customer commission has been successfully logged on the server ledger. Immediate processing required.</p>
    
    <div class="divider"></div>
    <h4>ORDER FILE CODES: <span class="font-mono" style="color:#000;">${order.id}</span></h4>
    
    <table class="meta-table">
      <tr>
        <td class="label">Date Registry:</td>
        <td class="font-mono">${new Date(order.createdAt).toISOString()}</td>
      </tr>
      <tr>
        <td class="label">Customer Name:</td>
        <td><strong>${billing.name}</strong></td>
      </tr>
      <tr>
        <td class="label">Phone Contact:</td>
        <td class="font-mono">+88${billing.phone}</td>
      </tr>
      <tr>
        <td class="label">Email Address:</td>
        <td>${billing.email || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Coordinates:</td>
        <td>${billing.address}, ${billing.district}, ${billing.division || 'N/A'} (${billing.postalCode || 'N/A'})</td>
      </tr>
      <tr>
        <td class="label">Order Notes:</td>
        <td style="font-style: italic; color: #c5a059;">${billing.notes || 'None'}</td>
      </tr>
      <tr>
        <td class="label">Payment Mode:</td>
        <td><strong style="color:red;">${order.paymentMethod.toUpperCase()}</strong></td>
      </tr>
      <tr>
        <td class="label">Payment State:</td>
        <td>${order.paymentVerified ? '🟢 VERIFIED' : '🔴 PENDING AUDIT'}</td>
      </tr>
      <tr>
        <td class="label">Client IP:</td>
        <td class="font-mono">${ip}</td>
      </tr>
      <tr>
        <td class="label">Browser Agent:</td>
        <td style="font-size:11px; color:#666;">${userAgent}</td>
      </tr>
    </table>

    <h4>ORDER COMPOSITION</h4>
    <table class="order-table">
      <thead>
        <tr>
          <th>Style Description</th>
          <th>SKU</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${renderProductRows(order.items)}
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:bold;">Subtotal:</td>
          <td class="text-right font-mono">৳${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:bold;">Delivery Fee:</td>
          <td class="text-right font-mono">৳${order.deliveryFee.toLocaleString()}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:bold; color:red;">Discount:</td>
          <td class="text-right font-mono" style="color:red;">-৳${order.discount.toLocaleString()}</td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="3" style="border:none;"></td>
          <td class="text-right" style="font-weight:900; text-transform:uppercase;">Grand Total:</td>
          <td class="text-right font-mono" style="font-weight:900; font-size:14px; border-bottom: 2px solid #000;">৳${order.total.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="divider"></div>
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'https://roymen.com'}/#/admin-dashboard" class="btn" style="background-color: #c5a059; color: #000 !important;">Go to Admin Cockpit</a>
    </div>
    ${LUXURY_FOOTER}
  `;
}

// 6. Generic Order Status Transition Template (Processing, Confirmed, Shipped, Delivered, Cancelled)
export function getOrderStatusTransitionTemplate(order: any, previousStatus: string, currentStatus: string): string {
  const billing = order.billingDetails;
  
  let statusHeadline = 'ORDER UPDATE DETECTED';
  let statusMessage = `Your order state has been updated to <strong>${currentStatus}</strong>.`;

  const normalized = currentStatus.toLowerCase().replace(/_/g, ' ');

  if (normalized.includes('process')) {
    statusHeadline = 'FABRICATION IN PROGRESS';
    statusMessage = 'Great news! Our tailoring logistics hub is currently assembling and preparing your luxurious attire. Your garments are undergoing a double-layered finishing audit.';
  } else if (normalized.includes('confirm') || normalized.includes('approve')) {
    statusHeadline = 'COMMISSION CONFIRMED';
    statusMessage = 'Your payment credentials and advance charges have been fully audited and approved. Your order is officially slated for active shipping transit.';
  } else if (normalized.includes('ship') || normalized.includes('dispatch')) {
    statusHeadline = 'DISPATCHED UNDER COURIER LOGISTICS';
    statusMessage = 'Your ROY MEN package has been carefully sealed in our dustproof signature sliding luxury drawer and transferred to our elite local courier services.';
  } else if (normalized.includes('deliver')) {
    statusHeadline = 'TRANSIT SATISFACTORILY CONCLUDED';
    statusMessage = 'Delivery confirmed! The package was successfully placed at your verified coordinates. We sincerely hope your purchase meets the standard of pure confidence.';
  } else if (normalized.includes('cancel') || normalized.includes('reject')) {
    statusHeadline = 'COMMISSION REVOKED / REJECTED';
    statusMessage = 'Please be advised that this order transaction has been cancelled. Any deposits made will be processed back to your original source number within 48-72 hours.';
  } else if (normalized.includes('pending')) {
    statusHeadline = 'COMMISSION REGISTRATION RECORDED';
    statusMessage = 'Your sartorial commission is registered and is currently pending verification of deposit credentials or billing codes.';
  } else if (normalized.includes('packed')) {
    statusHeadline = 'SARTORIAL PACKAGE PREPARED';
    statusMessage = 'Your selected garments have been meticulously assembled, inspected, and sealed within our dustproof signature black and gold slide drawer.';
  } else if (normalized.includes('return')) {
    statusHeadline = 'PACKAGE TRANSIT RETURNED';
    statusMessage = 'Your parcel has been registered as returned to our local logistics node. If this return was unintentional, please contact our helpdesk to schedule redelivery.';
  }

  return `
    ${LUXURY_HEADER}
    <h3>${statusHeadline}</h3>
    <p>Honorable ${billing.name},</p>
    <p>This automated dispatch brings you the latest status from the <strong>ROY MEN</strong> fulfillment network regarding your bespoke transaction <strong class="font-mono">${order.id}</strong>.</p>
    
    <div style="background-color: #fafafa; border: 1px solid #eaeaea; padding: 25px; border-radius: 4px; margin: 25px 0;">
      <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #000000;">
        ${statusMessage}
      </p>
      <div style="font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; margin-top: 15px; letter-spacing: 0.1em;">
        LOGISTICS PORT: <span class="highlight-gold">${previousStatus.toUpperCase()} ➔ ${currentStatus.toUpperCase()}</span>
      </div>
    </div>

    ${(normalized.includes('packed') || normalized.includes('ship') || normalized.includes('deliver') || order.courierName || order.trackingNumber || order.trackingUrl) ? `
    <div style="background-color: #fffaf0; border: 1px solid #f5e6c4; padding: 20px; border-radius: 4px; margin: 20px 0; font-size: 13px; line-height: 1.5; color: #1a1a1a;">
      <h4 style="margin: 0 0 10px 0; font-family: Georgia, serif; color: #c5a059; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em; font-weight: bold; border-b: 1px solid #f5e6c4; padding-bottom: 5px;">Logistics & Tracking Details</h4>
      ${order.courierName ? `<p style="margin: 4px 0;"><strong>Courier Company:</strong> ${order.courierName}</p>` : ''}
      ${order.trackingNumber ? `<p style="margin: 4px 0;"><strong>Tracking Number:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; color: #333;">${order.trackingNumber}</code></p>` : ''}
      ${order.trackingUrl ? `
      <p style="margin: 12px 0 0 0;">
        <a href="${order.trackingUrl.startsWith('http') ? order.trackingUrl : `https://${order.trackingUrl}`}" style="display: inline-block; background-color: #000000; color: #ffffff !important; text-decoration: none; padding: 8px 16px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 2px; letter-spacing: 0.08em;" target="_blank">Track Shipment Portal</a>
      </p>` : ''}
    </div>
    ` : ''}

    <p>You may continue to track this transit route in real-time inside your personal customer ledger.</p>
    <div class="divider"></div>
    <div style="text-align: center;">
      <a href="${process.env.APP_URL || 'https://roymen.com'}/#/order-tracking" class="btn">Track Order in Real-Time</a>
    </div>
    ${LUXURY_FOOTER}
  `;
}
