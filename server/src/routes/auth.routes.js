// ===========================================
// Auth Routes
// POST /api/auth/register — Citizen self-registration
// POST /api/auth/login    — Login with JWT
// POST /api/auth/send-otp — Send email OTP
// POST /api/auth/verify-otp — Verify email OTP
// ===========================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const prisma = require('../config/db');
const env = require('../config/env');
const { encrypt } = require('../services/crypto.service');
const { sendEmail } = require('../services/email.service');
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const { sendSuccess, sendError } = require('../utils/helpers');

// ---- POST /api/auth/register ----
// Public endpoint for Citizen self-registration.
// Admin-created accounts (DEPT_WORKER, OFFICER) are handled via /api/admin/users.
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409, 'DUPLICATE_EMAIL');
    }

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // Encrypt sensitive fields with AES-256
    const phoneEncrypted = phone ? encrypt(phone) : null;
    const addressEncrypted = address ? encrypt(address) : null;

    // Create user with default CITIZEN role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phoneEncrypted,
        addressEncrypted,
        role: 'CITIZEN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, { user }, 201, 'Registration successful');
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, 'Registration failed. Please try again.');
  }
});

// ---- POST /api/auth/login ----
// Authenticate user and return signed JWT token.
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 'This account has been deactivated. Contact admin.', 403, 'ACCOUNT_DEACTIVATED');
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, 'Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        departmentId: user.departmentId,
      },
    }, 200, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed. Please try again.');
  }
});

// ---- POST /api/auth/send-otp ----
// Generate a 6-digit OTP and "send" it via email (mocked in dev).
router.post('/send-otp', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate any existing unused OTPs for this user
    await prisma.oTP.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true },
    });

    // Create new OTP record
    await prisma.oTP.create({
      data: {
        userId,
        otpCode,
        expiresAt,
      },
    });

    // Send OTP via email (mocked in dev)
    await sendEmail({
      to: req.user.email,
      subject: 'Municipal Helpdesk — Email Verification OTP',
      body: `Your OTP code is: ${otpCode}\n\nThis code expires in 10 minutes.`,
      ticketId: null,
      recipientUserId: userId,
    });

    return sendSuccess(res, null, 200, 'OTP sent to your email address');
  } catch (error) {
    console.error('Send OTP error:', error);
    return sendError(res, 'Failed to send OTP. Please try again.');
  }
});

// ---- POST /api/auth/verify-otp ----
// Verify the OTP and mark user as email_verified.
router.post('/verify-otp', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return sendError(res, 'A valid 6-digit OTP is required.', 400, 'VALIDATION_ERROR');
    }

    // Find the latest unused, non-expired OTP for this user
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        otpCode: otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired OTP.', 400, 'INVALID_OTP');
    }

    // Mark OTP as used and user as verified (transaction)
    await prisma.$transaction([
      prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);

    return sendSuccess(res, null, 200, 'Email verified successfully');
  } catch (error) {
    console.error('Verify OTP error:', error);
    return sendError(res, 'OTP verification failed. Please try again.');
  }
});

module.exports = router;
