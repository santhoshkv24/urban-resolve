// ===========================================
// Database Configuration
// Singleton PrismaClient instance
// ===========================================

const { PrismaClient } = require('@prisma/client');

// Use a singleton pattern to prevent multiple PrismaClient instances
// during hot-reloading in development
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
