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
const { encrypt, decrypt } = require('../services/crypto.service');
const { sendEmail, getHtmlTemplate } = require('../services/email.service');
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
        civicTrustScore: true,
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
        civicTrustScore: user.civicTrustScore,
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
    console.log(`[AUTH] Generating OTP for user: ${userId} (${req.user.email})`);
    
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

    console.log(`[AUTH] Sending OTP email to ${req.user.email}...`);

    // Send OTP via email (mocked in dev)
    const emailStatus = await sendEmail({
      to: req.user.email,
      subject: 'Urban Resolve — Verify Your Account',
      body: `Your OTP code is: ${otpCode}`,
      html: getHtmlTemplate(
        'Verify Your Account',
        `
        <p>Thank you for joining Urban Resolve. Please use the following code to verify your email address:</p>
        <div class="otp-code">${otpCode}</div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        `
      ),
      recipientUserId: userId,
    });

    console.log(`[AUTH] OTP email status: ${emailStatus}`);

    return sendSuccess(res, null, 200, 'OTP sent to your email address');
  } catch (error) {
    console.error('[AUTH] send-otp error:', error);
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

// ---- POST /api/auth/forgot-password ----
// Send a reset OTP to the user's email if they forgot their password.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email is required.', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: Don't reveal if email exists, just say "If account exists..."
      return sendSuccess(res, null, 200, 'If an account exists, a reset code has been sent.');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Invalidate existing OTPs
    await prisma.oTP.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.oTP.create({
      data: { userId: user.id, otpCode, expiresAt },
    });

    await sendEmail({
      to: email,
      subject: 'Urban Resolve — Password Reset Code',
      body: `Your password reset code is: ${otpCode}`,
      html: getHtmlTemplate(
        'Reset Your Password',
        `
        <p>We received a request to reset your password. Use the code below to complete the process:</p>
        <div class="otp-code">${otpCode}</div>
        <p>This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        `
      ),
      recipientUserId: user.id,
    });

    return sendSuccess(res, null, 200, 'Reset code sent to your email.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return sendError(res, 'Failed to process request.');
  }
});

// ---- POST /api/auth/reset-password ----
// Verify OTP and update password.
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, OTP, and new password are required.', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, 'Invalid request.', 400);

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return sendError(res, 'Invalid or expired reset code.', 400, 'INVALID_OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return sendSuccess(res, null, 200, 'Password reset successful. You can now login.');
  } catch (error) {
    console.error('Reset password error:', error);
    return sendError(res, 'Failed to reset password.');
  }
});

// ---- GET /api/auth/me ----
// Returns fresh profile data for the authenticated user.
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        civicTrustScore: true,
        emailVerified: true,
        departmentId: true,
        phoneEncrypted: true,
        addressEncrypted: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return sendError(res, 'User not found.', 404, 'NOT_FOUND');
    }

    // Decrypt sensitive data
    user.phone = user.phoneEncrypted ? decrypt(user.phoneEncrypted) : null;
    user.address = user.addressEncrypted ? decrypt(user.addressEncrypted) : null;
    delete user.phoneEncrypted;
    delete user.addressEncrypted;

    return sendSuccess(res, { user });
  } catch (error) {
    console.error('Get auth profile error:', error);
    return sendError(res, 'Failed to fetch profile.');
  }
});

// ---- PUT /api/auth/profile ----
// Update user profile information.
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.userId;

    const data = {};
    if (name) data.name = name;
    if (phone) data.phoneEncrypted = encrypt(phone);
    if (address) data.addressEncrypted = encrypt(address);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        civicTrustScore: true,
        emailVerified: true,
        phoneEncrypted: true,
        addressEncrypted: true,
      },
    });

    // Decrypt sensitive data for return
    updatedUser.phone = updatedUser.phoneEncrypted ? decrypt(updatedUser.phoneEncrypted) : null;
    updatedUser.address = updatedUser.addressEncrypted ? decrypt(updatedUser.addressEncrypted) : null;
    delete updatedUser.phoneEncrypted;
    delete updatedUser.addressEncrypted;

    return sendSuccess(res, { user: updatedUser }, 200, 'Profile updated successfully.');
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'Failed to update profile.');
  }
});

module.exports = router;
