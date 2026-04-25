// ===========================================
// Environment Configuration
// Centralized access to all environment variables
// ===========================================

require('dotenv').config();

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // AES-256 Encryption
  AES_ENCRYPTION_KEY: process.env.AES_ENCRYPTION_KEY || 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  AES_IV_LENGTH: parseInt(process.env.AES_IV_LENGTH, 10) || 16,

  // AI Service
  AI_SERVICE_TYPE: process.env.AI_SERVICE_TYPE || 'mock',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  GCP_SERVICE_ACCOUNT_JSON: process.env.GCP_SERVICE_ACCOUNT_JSON || null,

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@urban-resolve.gov',
  MOCK_EMAIL: process.env.MOCK_EMAIL === 'true',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = env;
