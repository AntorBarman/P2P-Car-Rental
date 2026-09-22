const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      console.log('📧 Email service initialized');
    } else {
      console.warn('⚠️ Email credentials missing');
    }
  }

  async sendEmail(to, subject, html, text = '') {
    if (!this.transporter) {
      console.log('❌ Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'UDriveBD <noreply@udrivebd.com>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      return false;
    }
  }

  // ============================================
  // ✅ EMAIL TEMPLATES
  // ============================================

  getVerificationEmailTemplate(name, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Verify Your Email</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#1a202c;">✅ Verify Your Email</h1>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for registering with UDriveBD. Please verify your email address to complete your account setup.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verificationLink}" 
               style="background:#3182ce;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color:#718096;font-size:12px;">This link will expire in 24 hours.</p>
          <p style="color:#718096;font-size:12px;">If you didn't create an account with UDriveBD, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
          <p style="color:#a0aec0;font-size:12px;text-align:center;">© ${new Date().getFullYear()} UDriveBD. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  getEmailVerifiedTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Email Verified</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#38a169;">✅ Email Verified!</h1>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your email address has been successfully verified.</p>
          <p>You can now:</p>
          <ul style="color:#4a5568;">
            <li>✅ Browse and book vehicles</li>
            <li>✅ List your own vehicles (as an owner)</li>
            <li>✅ Receive booking confirmations</li>
          </ul>
          <p style="text-align:center;margin:30px 0;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background:#3182ce;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;">
              Start Exploring
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
          <p style="color:#a0aec0;font-size:12px;text-align:center;">© ${new Date().getFullYear()} UDriveBD. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(name, resetLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>Reset Password</title></head>
      <body style="font-family:Arial,sans-serif;background:#f5f7fa;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border-radius:12px;">
          <h1 style="color:#1a202c;">🔑 Reset Your Password</h1>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${resetLink}" 
               style="background:#3182ce;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color:#718096;font-size:12px;">This link will expire in 1 hour.</p>
          <p style="color:#718096;font-size:12px;">If you didn't request this, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
          <p style="color:#a0aec0;font-size:12px;text-align:center;">© ${new Date().getFullYear()} UDriveBD. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();