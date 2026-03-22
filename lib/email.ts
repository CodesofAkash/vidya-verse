import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const emailTemplates = {
  welcome: (name: string, verifyLink: string) => ({
    subject: '🎓 Welcome to VidyaVerse - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; background: #f9fafb; }
            .button { display: inline-block; background: #f97316; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
            .features { background: white; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .feature { display: flex; align-items: start; margin: 15px 0; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; background: #ffffff; }
            .divider { border-top: 2px solid #e5e7eb; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Welcome to VidyaVerse! 🎉</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your unified knowledge platform</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${name}!</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                Thank you for joining VidyaVerse! We're excited to have you on board. 
                To get started, please verify your email address by clicking the button below:
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${verifyLink}" class="button">Verify Email Address</a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #9ca3af;">${verifyLink}</span>
              </p>

              <div class="divider"></div>

              <h3 style="color: #1f2937; margin-bottom: 20px;">What you can do on VidyaVerse:</h3>
              
              <div class="features">
                <div class="feature">
                  <span class="feature-icon">📚</span>
                  <div>
                    <strong style="color: #1f2937;">VidyaVault</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Access thousands of high-quality notes, PYQs, and study materials</span>
                  </div>
                </div>

                <div class="feature">
                  <span class="feature-icon">💬</span>
                  <div>
                    <strong style="color: #1f2937;">VidyaManch</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Ask questions, get answers, and help your peers</span>
                  </div>
                </div>

                <div class="feature">
                  <span class="feature-icon">👥</span>
                  <div>
                    <strong style="color: #1f2937;">VidyaSetu</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Connect with mentors for personalized guidance</span>
                  </div>
                </div>

                <div class="feature">
                  <span class="feature-icon">🌐</span>
                  <div>
                    <strong style="color: #1f2937;">VidyaSangh</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Join communities of students from your college</span>
                  </div>
                </div>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                <strong>Note:</strong> This verification link will expire in 24 hours.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">VidyaVerse</p>
              <p style="margin: 0;">Your Unified Knowledge Platform</p>
              <p style="margin: 15px 0 0 0;">
                Need help? Contact us at 
                <a href="mailto:support@vidyaverse.com" style="color: #f97316;">support@vidyaverse.com</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: '🔐 Reset Your VidyaVerse Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; background: #f9fafb; }
            .button { display: inline-block; background: #f97316; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Password Reset Request 🔐</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${name},</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                We received a request to reset your VidyaVerse password. 
                Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>

              <div class="warning">
                <strong style="color: #92400e;">⚠️ Security Notice:</strong>
                <p style="margin: 8px 0 0 0; color: #78350f;">
                  This link will expire in 1 hour. If you didn't request this password reset, 
                  please ignore this email and your password will remain unchanged.
                </p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                If the button doesn't work, copy and paste this link:<br>
                <span style="word-break: break-all; color: #9ca3af;">${resetLink}</span>
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">VidyaVerse - Your Unified Knowledge Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  adminNotification: (userName: string, userEmail: string) => ({
    subject: '🎉 New User Signup - VidyaVerse',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 25px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🎉 New User Registration</h2>
            </div>
            <div class="content">
              <p>A new user just signed up on VidyaVerse!</p>
              <div class="info-box">
                <div class="info-row">
                  <strong>Name:</strong> ${userName}
                </div>
                <div class="info-row">
                  <strong>Email:</strong> ${userEmail}
                </div>
                <div class="info-row">
                  <strong>Registered At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </div>
              </div>
              <p>🚀 Your platform is growing!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  emailVerified: (name: string) => ({
    subject: '✅ Email Verified Successfully - VidyaVerse',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; background: #f9fafb; }
            .button { display: inline-block; background: #f97316; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
            .footer { text-align: center; padding: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Email Verified! ✅</h1>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Great news, ${name}!</h2>
              
              <p style="font-size: 16px; color: #4b5563;">
                Your email has been successfully verified. You now have full access to all VidyaVerse features!
              </p>

              <p style="font-size: 16px; color: #4b5563;">
                Start exploring thousands of resources, ask questions, connect with mentors, and join your college community.
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0;">VidyaVerse - Your Unified Knowledge Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Export sendEmail as an object with named methods so call sites can use
// sendEmail.welcome(...), sendEmail.passwordReset(...), etc.
export const sendEmail = {
  async welcome(name: string, verifyLink: string, to: string) {
    return _send(to, emailTemplates.welcome(name, verifyLink));
  },

  async passwordReset(name: string, resetLink: string, to: string) {
    return _send(to, emailTemplates.passwordReset(name, resetLink));
  },

  async adminNotification(userName: string, userEmail: string, to: string) {
    return _send(to, emailTemplates.adminNotification(userName, userEmail));
  },

  async emailVerified(name: string, to: string) {
    return _send(to, emailTemplates.emailVerified(name));
  },
};

async function _send(to: string, content: { subject: string; html: string }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"VidyaVerse" <noreply@vidyaverse.com>',
      to,
      subject: content.subject,
      html: content.html,
    });
    console.log(`✅ Email sent to ${to}: ${content.subject}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error };
  }
}

// Keep notifyAdmin helper for convenience
export async function notifyAdmin(userName: string, userEmail: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('⚠️ ADMIN_EMAIL not configured, skipping notification');
    return;
  }
  return sendEmail.adminNotification(userName, userEmail, adminEmail);
}