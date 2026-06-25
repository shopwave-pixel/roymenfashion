import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Sends a transactional email using the Brevo HTTP API.
 * Eliminates Nodemailer and SMTP protocols.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  throwOnError?: boolean
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@roymen.com';
  let senderName = process.env.EMAIL_FROM_NAME || 'ROY MEN';
  let senderEmail = emailFrom;

  // Smart-parse the sender if structured as: "Sender Name <email@domain.com>"
  if (emailFrom.includes('<') && emailFrom.includes('>')) {
    const match = emailFrom.match(/^(.*?)\s*<(.*?)>$/);
    if (match) {
      senderName = match[1].trim() || senderName;
      senderEmail = match[2].trim();
    }
  }

  // Task 10: Before sending, log hostname, port, secure, and user info
  console.log('=================== BREVO REST API SENDMAIL PARAMETERS ===================');
  console.log(`- Hostname (API URL):   ${BREVO_API_URL}`);
  console.log(`- Connection Port:      443 (HTTPS)`);
  console.log(`- Secure (TLS/SSL):     true`);
  console.log(`- Sender Name:          ${senderName}`);
  console.log(`- Sender Email (User):  ${senderEmail}`);
  console.log(`- Target Recipient:     ${to}`);
  console.log(`- Subject Line:         ${subject}`);
  console.log(`- API Key Status:       ${apiKey ? 'CONFIGURED (VALUE HIDDEN)' : 'NOT CONFIGURED'}`);
  console.log('==========================================================================');

  if (!apiKey) {
    console.warn('[ROYMEN Brevo Service] Warning: BREVO_API_KEY environment variable is not defined. Falling back to terminal log.');
    console.log(`\n================== [BREVO EMAIL FALLBACK LOG] ==================`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content Size: ${html.length} chars`);
    console.log(`================================================================\n`);
    return true;
  }

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject,
      htmlContent: html
    };

    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000 // 15s timeout
    });

    // Task 7 & 8: Log every API response details
    console.log('=================== BREVO API SUCCESS RESPONSE ===================');
    console.log(`- Status Code: ${response.status} ${response.statusText}`);
    console.log(`- Headers:     ${JSON.stringify(response.headers)}`);
    console.log(`- Data:        ${JSON.stringify(response.data)}`);
    console.log('==================================================================');

    return true;
  } catch (error: any) {
    console.error('=================== BREVO API FAILURE RESPONSE ===================');
    if (error.response) {
      console.error(`- Status Code: ${error.response.status}`);
      console.error(`- Headers:     ${JSON.stringify(error.response.headers)}`);
      console.error(`- Error Data:  ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`- Connection Error Message: ${error.message}`);
    }
    console.error('==================================================================');

    if (throwOnError) {
      throw error;
    }
    return false;
  }
}
