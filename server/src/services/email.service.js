// ===========================================
// Email Notification Service
// Sends emails via Nodemailer (or mocks to console)
// Logs all notifications to NotificationLog table
// ===========================================

const nodemailer = require('nodemailer');
const env = require('../config/env');
const prisma = require('../config/db');

// Create transporter
let transporter;

if (env.MOCK_EMAIL) {
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧 [MOCK EMAIL] ========================');
      console.log(`   To:      ${mailOptions.to}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log(`   Body:    ${mailOptions.text || mailOptions.html}`);
      console.log('========================================\n');
      return { messageId: `mock-${Date.now()}` };
    },
  };
} else {
  const isGmail = env.SMTP_HOST.includes('gmail.com');
  const transportConfig = isGmail 
    ? {
        service: 'gmail',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
      };

  transporter = nodemailer.createTransport(transportConfig);
}

/**
 * Base HTML Template for all system emails
 */
const getHtmlTemplate = (title, content, footerText = 'This is an automated message from the Urban Resolve System.') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; }
        .title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
        .message { color: #475569; font-size: 16px; margin-bottom: 24px; }
        .info-card { background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px; }
        .info-row { margin-bottom: 8px; font-size: 14px; display: flex; }
        .info-label { font-weight: 600; color: #64748b; width: 120px; flex-shrink: 0; }
        .info-value { color: #1e293b; }
        .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; }
        .otp-code { font-size: 32px; font-weight: 800; color: #3b82f6; letter-spacing: 8px; text-align: center; margin: 24px 0; font-family: monospace; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .badge-info { background-color: #dbeafe; color: #1e40af; }
        .badge-success { background-color: #dcfce7; color: #166534; }
        .badge-warning { background-color: #fef9c3; color: #854d0e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Urban Resolve</h1>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          <div class="message">${content}</div>
        </div>
        <div class="footer">
          ${footerText}<br>
          Building a better city, together.
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send an email and log it to the NotificationLog table.
 */
const sendEmail = async ({ to, subject, body, html, ticketId, recipientUserId, deepLink }) => {
  let status = 'MOCKED';

  try {
    await transporter.sendMail({
      from: `"Urban Resolve" <${env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      html: html || getHtmlTemplate(subject, body),
    });

    status = env.MOCK_EMAIL ? 'MOCKED' : 'SENT';
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    status = 'FAILED';
  }

  if (recipientUserId) {
    try {
      await prisma.notificationLog.create({
        data: {
          ticketId: ticketId || null,
          recipientUserId,
          emailTo: to,
          subject,
          body: body || (html ? 'HTML Content' : ''),
          deepLink: deepLink || null,
          status,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log notification:', logError.message);
    }
  }

  return status;
};

// ---- Ticket Notification Templates ----

const notifyTicketAssigned = async (ticket, citizenEmail, citizenId) => {
  const title = `Ticket Assigned: #${ticket.id}`;
  const content = `Your civic issue report has been assigned to a department worker. We are working to resolve this within the SLA period.`;
  const html = getHtmlTemplate(title, `
    <p>${content}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-value">#${ticket.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="badge badge-info">Assigned</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Category:</span>
        <span class="info-value">${ticket.assignedDepartment?.name || 'Municipal Service'}</span>
      </div>
    </div>
  `);

  return sendEmail({
    to: citizenEmail,
    subject: `Update on Ticket #${ticket.id} — Assigned`,
    body: content,
    html,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

const notifyTicketResolved = async (ticket, citizenEmail, citizenId) => {
  const title = `Ticket Resolved: #${ticket.id}`;
  const content = `Great news! Your reported issue has been marked as resolved by our department team. Thank you for helping us maintain our city infrastructure.`;
  const html = getHtmlTemplate(title, `
    <p>${content}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-value">#${ticket.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="badge badge-success">Resolved</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Resolution:</span>
        <span class="info-value">${ticket.resolutionNotes || 'Task completed successfully.'}</span>
      </div>
    </div>
  `);

  return sendEmail({
    to: citizenEmail,
    subject: `Ticket Resolved — #${ticket.id}`,
    body: content,
    html,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

const notifyTicketEscalated = async (ticket, adminEmail, adminId) => {
  const title = `Action Required: Escalation #${ticket.id}`;
  const content = `A ticket has been escalated for administrative review. The worker has flagged this as a potential false report or requires special intervention.`;
  const html = getHtmlTemplate(title, `
    <p>${content}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-value">#${ticket.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reason:</span>
        <span class="info-value">${ticket.escalationReason || 'Manual Escalation'}</span>
      </div>
    </div>
  `);

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ Escalation Alert — Ticket #${ticket.id}`,
    body: content,
    html,
    ticketId: ticket.id,
    recipientUserId: adminId,
  });
};

const notifyTicketRejected = async (ticket, citizenEmail, citizenId) => {
  const title = `Ticket Closed: #${ticket.id}`;
  const content = `Your ticket has been reviewed and closed by the administration. This may be due to duplication, insufficient information, or the issue being outside municipal jurisdiction.`;
  const html = getHtmlTemplate(title, `
    <p>${content}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-value">#${ticket.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Note:</span>
        <span class="info-value">${ticket.adminResolutionNotes || 'Case closed after review.'}</span>
      </div>
    </div>
  `);

  return sendEmail({
    to: citizenEmail,
    subject: `Ticket Closed — #${ticket.id}`,
    body: content,
    html,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

const notifyTicketReassigned = async (ticket, workerEmail, workerId) => {
  const title = `New Task Assigned: #${ticket.id}`;
  const content = `You have been assigned to resolve a new civic issue ticket. Please review the details and updates on your worker dashboard.`;
  const html = getHtmlTemplate(title, `
    <p>${content}</p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID:</span>
        <span class="info-value">#${ticket.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Priority:</span>
        <span class="info-value">${ticket.priority}</span>
      </div>
    </div>
  `);

  return sendEmail({
    to: workerEmail,
    subject: `Task Assignment — Ticket #${ticket.id}`,
    body: content,
    html,
    ticketId: ticket.id,
    recipientUserId: workerId,
  });
};

const logSystemNotification = async ({ recipientUserId, subject, body, deepLink, ticketId }) => {
  // Find recipient email first
  const user = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { email: true }
  });

  if (!user) return null;

  return sendEmail({
    to: user.email,
    subject,
    body,
    recipientUserId,
    deepLink,
    ticketId
  });
};

module.exports = {
  sendEmail,
  getHtmlTemplate,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketEscalated,
  notifyTicketRejected,
  notifyTicketReassigned,
  logSystemNotification,
  verifyEmailConnection: async () => {
    if (env.MOCK_EMAIL) return true;
    try {
      await transporter.verify();
      return true;
    } catch (e) {
      return false;
    }
  }
};
