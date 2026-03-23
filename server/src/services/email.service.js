// ===========================================
// Email Notification Service
// Sends emails via Nodemailer (or mocks to console)
// Logs all notifications to NotificationLog table
// ===========================================

const nodemailer = require('nodemailer');
const env = require('../config/env');
const prisma = require('../config/db');

// Create transporter — uses mock (ethereal) in dev, real SMTP in production
let transporter;

if (env.MOCK_EMAIL) {
  // Mock mode: log to console instead of actually sending
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
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Send an email and log it to the NotificationLog table.
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body (plain text)
 * @param {number} params.ticketId - Associated ticket ID
 * @param {number} params.recipientUserId - Recipient user ID
 */
const sendEmail = async ({ to, subject, body, ticketId, recipientUserId }) => {
  let status = 'MOCKED';

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text: body,
    });

    status = env.MOCK_EMAIL ? 'MOCKED' : 'SENT';
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    status = 'FAILED';
  }

  // Log the notification to the database (only for ticket-related emails)
  if (ticketId && recipientUserId) {
    try {
      await prisma.notificationLog.create({
        data: {
          ticketId,
          recipientUserId,
          emailTo: to,
          subject,
          body,
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

/**
 * Notify citizen that their ticket has been assigned
 */
const notifyTicketAssigned = async (ticket, citizenEmail, citizenId) => {
  return sendEmail({
    to: citizenEmail,
    subject: `Your ticket #${ticket.id} has been assigned`,
    body: `Hello,\n\nYour civic issue ticket #${ticket.id} has been assigned to a department worker and is being addressed.\n\nYou can track the progress on your dashboard.\n\nThank you,\nMunicipal Helpdesk`,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

/**
 * Notify citizen that their ticket has been resolved
 */
const notifyTicketResolved = async (ticket, citizenEmail, citizenId) => {
  return sendEmail({
    to: citizenEmail,
    subject: `Your ticket #${ticket.id} has been resolved`,
    body: `Hello,\n\nYour civic issue ticket #${ticket.id} has been resolved by our team.\n\nResolution Notes: ${ticket.resolutionNotes || 'N/A'}\n\nThank you for reporting this issue.\n\nMunicipal Helpdesk`,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

/**
 * Notify admin that a ticket has been escalated
 */
const notifyTicketEscalated = async (ticket, adminEmail, adminId) => {
  return sendEmail({
    to: adminEmail,
    subject: `Ticket #${ticket.id} escalated — review required`,
    body: `Hello Admin,\n\nTicket #${ticket.id} has been flagged as a false report by the assigned worker.\n\nReason: ${ticket.escalationReason || 'N/A'}\n\nPlease review and take action.\n\nMunicipal Helpdesk`,
    ticketId: ticket.id,
    recipientUserId: adminId,
  });
};

/**
 * Notify citizen that their ticket has been rejected
 */
const notifyTicketRejected = async (ticket, citizenEmail, citizenId) => {
  return sendEmail({
    to: citizenEmail,
    subject: `Your ticket #${ticket.id} has been closed`,
    body: `Hello,\n\nYour civic issue ticket #${ticket.id} has been reviewed and closed.\n\nAdmin Notes: ${ticket.adminResolutionNotes || 'N/A'}\n\nMunicipal Helpdesk`,
    ticketId: ticket.id,
    recipientUserId: citizenId,
  });
};

/**
 * Notify worker that a ticket has been re-assigned to them
 */
const notifyTicketReassigned = async (ticket, workerEmail, workerId) => {
  return sendEmail({
    to: workerEmail,
    subject: `Ticket #${ticket.id} has been re-assigned to you`,
    body: `Hello,\n\nTicket #${ticket.id} has been re-assigned to you for resolution.\n\nPlease check your dashboard for details.\n\nMunicipal Helpdesk`,
    ticketId: ticket.id,
    recipientUserId: workerId,
  });
};

module.exports = {
  sendEmail,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketEscalated,
  notifyTicketRejected,
  notifyTicketReassigned,
};
