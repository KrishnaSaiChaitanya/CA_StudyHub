import "server-only";
import { Resend } from "resend";

// --- Configuration & Constants ---
const BRAND_COLOR = "#3B82F6";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#475569";
const BORDER_COLOR = "#E2E8F0";

// --- Resend Client ---
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, fromEmail }: { to: string; subject: string; html: string, fromEmail?: string }) => {
  try {
    const fromAddress = fromEmail || process.env.SMTP_FROM_EMAIL || "onboarding@resend.dev";
    const { data, error } = await resend.emails.send({
      from: `"${process.env.SMTP_FROM_NAME || "CAStudyHub"}" <${fromAddress}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error("Error sending email via Resend:", error);
    return { success: false, error: error.message };
  }
};

// --- Helper: Email Wrapper ---
const getEmailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0F172A !important; }
      .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .text-primary { color: #F8FAFC !important; }
      .text-muted { color: #94A3B8 !important; }
    }
    body { font-family: 'Inter', -apple-system, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;" class="email-bg">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid ${BORDER_COLOR}; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" class="email-card">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="https://res.cloudinary.com/dsfems7vy/image/upload/v1776190017/Logo_jaoong.png" alt="CAStudyHub" style="height: 60px; width: auto; display: block;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="font-size: 16px; line-height: 1.6; color: ${TEXT_DARK};" class="text-primary">
                ${content}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px; background-color: #F1F5F9; text-align: center;" class="email-footer">
              <p style="margin: 0; font-size: 13px; color: ${TEXT_MUTED};" class="text-muted">&copy; ${new Date().getFullYear()} CAStudyHub. Built for the community.</p>
              <p style="margin: 8px 0 0; font-size: 12px; color: ${TEXT_MUTED};" class="text-muted">You received this because of your activity on CAStudyHub.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- Email Templates ---

export const getSubmissionReceivedEmail = (userName: string, title: string) => {
  return getEmailWrapper(`
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">We've got it! 📝</h2>
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Thank you for contributing! Your submission "<strong>${title}</strong>" has been received and is currently in our review queue.</p>
    
    <div style="margin: 32px 0; padding: 24px; background-color: #EFF6FF; border-radius: 12px; border: 1px solid #DBEAFE; text-align: left;">
       <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${BRAND_COLOR}; text-transform: uppercase; letter-spacing: 0.05em;">Current Status</p>
       <p style="margin: 8px 0 0; font-size: 16px; font-weight: 600; color: ${TEXT_DARK};">Verification in progress</p>
       <p style="margin: 4px 0 0; font-size: 14px; color: ${TEXT_MUTED};">Our team ensures all content meets community standards before going live.</p>
    </div>
    
    <p style="margin-bottom: 0;">We'll notify you as soon as the review is complete!</p>
  `);
};

export const getVerificationEmail = (link: string) => {
  return getEmailWrapper(`
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">Verify your email 📧</h2>
    <p>Welcome to <strong>CAStudyHub</strong>! We're excited to have you join our community.</p>
    <p>Please click the button below to verify your email address and activate your account.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" 
         style="display: inline-block; background-color: ${BRAND_COLOR}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">
         Verify Email Address
      </a>
    </div>
    
    <p style="font-size: 14px; color: ${TEXT_MUTED};">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: ${BRAND_COLOR};">${link}</p>
    
    <p style="margin-top: 24px; font-size: 14px; color: ${TEXT_MUTED};">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);
};

export const getPasswordResetEmail = (link: string) => {
  return getEmailWrapper(`
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">Reset your password 🔒</h2>
    <p>We received a request to reset the password for your CAStudyHub account.</p>
    <p>Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" 
         style="display: inline-block; background-color: ${BRAND_COLOR}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">
         Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: ${TEXT_MUTED};">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: ${BRAND_COLOR};">${link}</p>
    
    <p style="margin-top: 24px; font-size: 14px; color: ${TEXT_MUTED};">This link will expire in 1 hour. For security, never share this link with anyone.</p>
  `);
};

export const getSubmissionStatusEmail = (userName: string, title: string, status: "approved" | "rejected", feedback?: string) => {
  const isApproved = status === "approved";
  const accentColor = isApproved ? "#10B981" : "#EF4444";
  const statusBg = isApproved ? "#F0FDF4" : "#FEF2F2";
  const statusBorder = isApproved ? "#DCFCE7" : "#FEE2E2";

  return getEmailWrapper(`
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">
      ${isApproved ? "Great news! 🎉" : "Submission Update"}
    </h2>
    <p>Hi <strong>${userName}</strong>,</p>
    <p>The review for your submission "<strong>${title}</strong>" is complete.</p>
    
    <div style="margin: 32px 0; padding: 24px; background-color: ${statusBg}; border-radius: 12px; border: 1px solid ${statusBorder}; text-align: center;">
       <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${accentColor}; text-transform: uppercase;">Final Status</p>
       <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: ${TEXT_DARK}; text-transform: capitalize;">${status}</p>
    </div>

    ${feedback ? `
      <div style="margin-bottom: 32px; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border-left: 4px solid ${BORDER_COLOR};">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: ${TEXT_MUTED}; text-transform: uppercase;">Reviewer Feedback</p>
        <p style="margin: 0; font-size: 15px; font-style: italic;">"${feedback}"</p>
      </div>
    ` : ""}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/community" 
         style="display: inline-block; background-color: ${BRAND_COLOR}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
         ${isApproved ? "View Material" : "Visit Community"}
      </a>
    </div>
  `);
};

export const getWaitlistNotificationEmail = (email: string) => {
  return getEmailWrapper(`
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0;">New Waitlist Joiner! 🚀</h2>
    <p>A new user has just joined the waitlist for CAStudyHub.</p>
    
    <div style="margin: 32px 0; padding: 24px; background-color: #F8FAFC; border-radius: 12px; border: 1px solid ${BORDER_COLOR};">
       <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${TEXT_MUTED}; text-transform: uppercase;">User Email</p>
       <p style="margin: 8px 0 0; font-size: 18px; font-weight: 600; color: ${TEXT_DARK};">${email}</p>
    </div>
    
    <p style="margin-bottom: 0;">You might want to reach out to them or keep them in your mailing list for the launch!</p>
  `);
};