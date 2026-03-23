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

// ─── helpers ─────────────────────────────────────────────────────────────────

const BASE_STYLE = `
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
  .container{max-width:600px;margin:0 auto;background:#fff}
  .header{background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);color:white;padding:40px 30px;text-align:center}
  .content{padding:40px 30px;background:#f9fafb}
  .button{display:inline-block;background:#f97316;color:white;padding:14px 40px;text-decoration:none;border-radius:8px;margin:25px 0;font-weight:600}
  .footer{text-align:center;padding:30px;color:#6b7280;font-size:14px;background:#fff}
  .divider{border-top:2px solid #e5e7eb;margin:25px 0}
  .badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:600}
  .badge-green{background:#d1fae5;color:#065f46}
  .badge-red{background:#fee2e2;color:#991b1b}
  .badge-orange{background:#ffedd5;color:#9a3412}
  .badge-blue{background:#dbeafe;color:#1e40af}
  .info-box{background:#fff;border:1px solid #e5e7eb;padding:20px;border-radius:8px;margin:20px 0}
`;

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

// ─── templates ───────────────────────────────────────────────────────────────

const templates = {
  welcome: (name: string, verifyLink: string) => ({
    subject: '🎓 Welcome to VidyaVerse — Verify Your Email',
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header"><h1 style="margin:0;font-size:28px">Welcome to VidyaVerse! 🎉</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${name}!</h2>
          <p>Thank you for joining. Please verify your email to get started.</p>
          <div style="text-align:center"><a href="${verifyLink}" class="button">Verify Email Address</a></div>
          <p style="font-size:14px;color:#6b7280">Or paste this link: <span style="word-break:break-all">${verifyLink}</span></p>
          <p style="font-size:14px;color:#6b7280"><strong>Note:</strong> This link expires in 24 hours.</p>
        </div>
        <div class="footer"><p style="margin:0;font-weight:600;color:#1f2937">VidyaVerse</p><p>Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: '🔐 Reset Your VidyaVerse Password',
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header"><h1 style="margin:0;font-size:28px">Password Reset 🔐</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${name},</h2>
          <p>We received a request to reset your password.</p>
          <div style="text-align:center"><a href="${resetLink}" class="button">Reset Password</a></div>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:4px">
            <strong style="color:#92400e">⚠️ Security Notice:</strong>
            <p style="margin:8px 0 0;color:#78350f">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
          <p style="font-size:14px;color:#6b7280">Or paste: <span style="word-break:break-all">${resetLink}</span></p>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  emailVerified: (name: string) => ({
    subject: '✅ Email Verified Successfully — VidyaVerse',
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#10b981 0%,#059669 100%)"><h1 style="margin:0;font-size:28px">Email Verified! ✅</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Great news, ${name}!</h2>
          <p>Your email has been successfully verified. You now have full access to VidyaVerse.</p>
          <div style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  adminNotification: (userName: string, userEmail: string) => ({
    subject: '🎉 New User Signup — VidyaVerse',
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:#1f2937"><h2 style="margin:0">🎉 New User Registration</h2></div>
        <div class="content">
          <div class="info-box">
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <p>🚀 Your platform is growing!</p>
        </div>
      </div>
    </body></html>`,
  }),

  // ── Role request templates ────────────────────────────────────────────────

  roleRequestSubmitted: (userName: string, requestedRole: string, reason: string, reviewUrl: string, to: string) => ({
    subject: `🔔 New Role Request: ${requestedRole} — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header"><h1 style="margin:0;font-size:24px">New Role Request 🔔</h1></div>
        <div class="content">
          <p>A user has requested a role upgrade on VidyaVerse.</p>
          <div class="info-box">
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Requested Role:</strong> <span class="badge badge-blue">${requestedRole}</span></p>
            <p><strong>Reason:</strong></p>
            <p style="background:#f9fafb;padding:12px;border-radius:6px;border-left:3px solid #f97316">${reason}</p>
          </div>
          <div style="text-align:center"><a href="${reviewUrl}" class="button">Review Request</a></div>
        </div>
        <div class="footer"><p>VidyaVerse Admin Panel</p></div>
      </div>
    </body></html>`,
  }),

  roleRequestApproved: (userName: string, approvedRole: string) => ({
    subject: `✅ Role Request Approved: ${approvedRole} — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#10b981 0%,#059669 100%)"><h1 style="margin:0;font-size:24px">Role Approved! ✅</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Congratulations, ${userName}!</h2>
          <p>Your role request has been <strong>approved</strong>. You are now a:</p>
          <div style="text-align:center;margin:20px 0"><span class="badge badge-green" style="font-size:18px;padding:8px 24px">${approvedRole}</span></div>
          <p>You now have access to all features associated with this role. Log in to get started.</p>
          <div style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  roleRequestRejected: (userName: string, requestedRole: string, reason: string) => ({
    subject: `❌ Role Request Update — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%)"><h1 style="margin:0;font-size:24px">Role Request Update</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${userName},</h2>
          <p>We've reviewed your request for <strong>${requestedRole}</strong> role and unfortunately it was not approved at this time.</p>
          <div class="info-box">
            <p><strong>Reason:</strong></p>
            <p style="color:#6b7280">${reason}</p>
          </div>
          <p>You can submit a new request after addressing the feedback above. Keep contributing to VidyaVerse!</p>
          <div style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/role-request" class="button">Submit New Request</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  // ── Upload moderation templates ───────────────────────────────────────────

  uploadApproved: (userName: string, resourceTitle: string, resourceUrl: string) => ({
    subject: `✅ Your upload "${resourceTitle}" is approved — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#10b981 0%,#059669 100%)"><h1 style="margin:0;font-size:24px">Upload Approved! ✅</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Great news, ${userName}!</h2>
          <p>Your resource has been reviewed and published on VidyaVerse.</p>
          <div class="info-box"><p><strong>Resource:</strong> ${resourceTitle}</p></div>
          <div style="text-align:center"><a href="${resourceUrl}" class="button">View Your Resource</a></div>
          <p>Thank you for contributing to the community! 🎉</p>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  uploadRejected: (userName: string, resourceTitle: string, reason: string) => ({
    subject: `❌ Upload update: "${resourceTitle}" — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%)"><h1 style="margin:0;font-size:24px">Upload Not Approved</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${userName},</h2>
          <p>Your upload <strong>"${resourceTitle}"</strong> was reviewed and could not be approved.</p>
          <div class="info-box">
            <p><strong>Reason:</strong></p>
            <p style="color:#6b7280">${reason}</p>
          </div>
          <p>You may edit and re-submit from your uploads dashboard.</p>
          <div style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/uploads" class="button">View My Uploads</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  // ── Mentor booking templates ──────────────────────────────────────────────

  mentorBookingReceived: (mentorName: string, menteeName: string, subject: string, message: string, bookingUrl: string) => ({
    subject: `📚 New Mentorship Request — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header"><h1 style="margin:0;font-size:24px">New Mentorship Request 📚</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${mentorName},</h2>
          <p>You have a new mentorship session request!</p>
          <div class="info-box">
            <p><strong>From:</strong> ${menteeName}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="background:#f9fafb;padding:12px;border-radius:6px;border-left:3px solid #f97316">${message}</p>
          </div>
          <div style="text-align:center"><a href="${bookingUrl}" class="button">Respond to Request</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),

  mentorBookingConfirmed: (menteeName: string, mentorName: string, subject: string) => ({
    subject: `✅ Mentorship Session Confirmed — VidyaVerse`,
    html: `<!DOCTYPE html><html><head><style>${BASE_STYLE}</style></head><body>
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#10b981 0%,#059669 100%)"><h1 style="margin:0;font-size:24px">Session Confirmed! ✅</h1></div>
        <div class="content">
          <h2 style="color:#1f2937;margin-top:0">Hello ${menteeName},</h2>
          <p>Your mentorship session with <strong>${mentorName}</strong> has been confirmed.</p>
          <div class="info-box"><p><strong>Topic:</strong> ${subject}</p></div>
          <p>Your mentor will share a meeting link and schedule details soon. Check your dashboard for updates.</p>
          <div style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vidya-setu/bookings" class="button">View My Bookings</a></div>
        </div>
        <div class="footer"><p>VidyaVerse — Your Unified Knowledge Platform</p></div>
      </div>
    </body></html>`,
  }),
};

// ─── public API ──────────────────────────────────────────────────────────────

export const sendEmail = {
  async welcome(name: string, verifyLink: string, to: string) {
    return _send(to, templates.welcome(name, verifyLink));
  },
  async passwordReset(name: string, resetLink: string, to: string) {
    return _send(to, templates.passwordReset(name, resetLink));
  },
  async emailVerified(name: string, to: string) {
    return _send(to, templates.emailVerified(name));
  },
  async adminNotification(userName: string, userEmail: string, to: string) {
    return _send(to, templates.adminNotification(userName, userEmail));
  },
  async roleRequestSubmitted(userName: string, requestedRole: string, reason: string, reviewUrl: string, to: string) {
    return _send(to, templates.roleRequestSubmitted(userName, requestedRole, reason, reviewUrl, to));
  },
  async roleRequestApproved(userName: string, approvedRole: string, to: string) {
    return _send(to, templates.roleRequestApproved(userName, approvedRole));
  },
  async roleRequestRejected(userName: string, requestedRole: string, reason: string, to: string) {
    return _send(to, templates.roleRequestRejected(userName, requestedRole, reason));
  },
  async uploadApproved(userName: string, resourceTitle: string, resourceUrl: string, to: string) {
    return _send(to, templates.uploadApproved(userName, resourceTitle, resourceUrl));
  },
  async uploadRejected(userName: string, resourceTitle: string, reason: string, to: string) {
    return _send(to, templates.uploadRejected(userName, resourceTitle, reason));
  },
  async mentorBookingReceived(mentorName: string, menteeName: string, subject: string, message: string, bookingUrl: string, to: string) {
    return _send(to, templates.mentorBookingReceived(mentorName, menteeName, subject, message, bookingUrl));
  },
  async mentorBookingConfirmed(menteeName: string, mentorName: string, subject: string, to: string) {
    return _send(to, templates.mentorBookingConfirmed(menteeName, mentorName, subject));
  },
};

export async function notifyAdmin(userName: string, userEmail: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  return sendEmail.adminNotification(userName, userEmail, adminEmail);
}