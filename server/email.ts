// Email delivery service for magic links and notifications
import nodemailer from 'nodemailer';
import { 
  SMTP_HOST, 
  SMTP_PORT, 
  SMTP_USER, 
  SMTP_PASS, 
  SMTP_FROM, 
  APP_BASE_URL,
  EMAIL_ENABLED,
  EMAIL_PREVIEW_MODE 
} from './config';
import { statements } from './db';

// Create nodemailer transporter
const transporter = EMAIL_ENABLED ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
}) : null;

/**
 * Send magic link email to user
 */
export async function sendMagicLink(email: string, token: string): Promise<void> {
  const magicLinkUrl = `${APP_BASE_URL}/?token=${token}`;
  
  const subject = 'Your LearnOz Sign-in Link';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>LearnOz Sign-in Link</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { padding: 20px 30px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        .expires { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏝️ LearnOz</h1>
        </div>
        <div class="content">
          <h2>Sign in to your account</h2>
          <p>Click the button below to securely sign in to your LearnOz account:</p>
          
          <a href="${magicLinkUrl}" class="button">Sign In to LearnOz</a>
          
          <div class="expires">
            ⏰ This link expires in 24 hours for security.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${magicLinkUrl}</p>
          
          <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          This email was sent by LearnOz. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
LearnOz Sign-in Link

Click this link to sign in to your LearnOz account:
${magicLinkUrl}

This link expires in 24 hours for security.

If you didn't request this sign-in link, you can safely ignore this email.

---
This email was sent by LearnOz. Please do not reply to this email.
  `.trim();

  if (EMAIL_PREVIEW_MODE) {
    // Development preview mode - log to console instead of sending
    console.log('\n📧 MAGIC LINK EMAIL PREVIEW');
    console.log('=====================================');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Magic Link: ${magicLinkUrl}`);
    console.log('=====================================\n');
    
    // Log audit event
    statements.insertAuditLog.run(Date.now(), email, 'magic_link_preview', JSON.stringify({
      url: magicLinkUrl,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
    
    return;
  }

  if (!EMAIL_ENABLED || !transporter) {
    console.error('❌ Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.');
    
    // Log audit event
    statements.insertAuditLog.run(Date.now(), email, 'email_send_error', JSON.stringify({
      error: 'SMTP not configured',
      url: magicLinkUrl
    }));
    
    throw new Error('Email service not configured');
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`✅ Magic link email sent to ${email}`);
    
    // Log successful send
    statements.insertAuditLog.run(Date.now(), email, 'magic_link_sent', JSON.stringify({
      url: magicLinkUrl,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
    
  } catch (error) {
    console.error(`❌ Failed to send magic link email to ${email}:`, error);
    
    // Log send error
    statements.insertAuditLog.run(Date.now(), email, 'email_send_error', JSON.stringify({
      error: error.message,
      url: magicLinkUrl
    }));
    
    throw new Error('Failed to send email');
  }
}

/**
 * Verify email deliverability (for health checks)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (EMAIL_PREVIEW_MODE) {
    console.log('📧 Email in preview mode (development)');
    return true;
  }
  
  if (!EMAIL_ENABLED || !transporter) {
    console.warn('⚠️  Email not configured');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP verification failed:', error);
    return false;
  }
}

// TODO: Webhook handling for bounces/complaints
// export async function handleEmailWebhook(req: Request, res: Response) {
//   // Handle bounce/complaint webhooks from email provider
//   // Log audit events for bounced emails
//   // Update user email status if needed
// }