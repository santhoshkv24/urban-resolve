// ===========================================
// AES-256 Encryption Service
// Encrypts/decrypts sensitive fields (phone, address)
// ===========================================

const crypto = require('crypto');
const env = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(env.AES_ENCRYPTION_KEY, 'utf-8').subarray(0, 32); // Ensure exactly 32 bytes
const IV_LENGTH = env.AES_IV_LENGTH;

/**
 * Encrypt a plaintext string using AES-256-CBC.
 * The IV is prepended to the ciphertext (hex-encoded) separated by ":".
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted string in format "iv:ciphertext"
 */
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt an AES-256-CBC encrypted string.
 * Expects input in format "iv:ciphertext" (hex-encoded).
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} Decrypted plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt };
