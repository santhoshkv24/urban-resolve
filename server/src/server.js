// ===========================================
// Server Entry Point
// Starts the Express server on configured port
// ===========================================

const fs = require('fs');
const path = require('path');
const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

// Ensure uploads directory exists for local development
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const prisma = require('./config/db');
const { verifyEmailConnection } = require('./services/email.service');
const { checkAiStatus } = require('./services/ai.service');

app.listen(PORT, async () => {
  console.log(`\n🏛️  URBAN RESOLVE — Backend Initializing...`);
  
  // Connection Checks
  let dbStatus = '❌ Offline';
  let emailStatus = '❌ Disconnected';
  const aiStatus = checkAiStatus();
  const storageStatus = '☁️  Cloudinary (Active)';

  try {
    await prisma.$connect();
    dbStatus = '✅ Connected (PostgreSQL)';
  } catch (e) {
    dbStatus = `❌ Error: ${e.message}`;
  }

  const emailOk = await verifyEmailConnection();
  emailStatus = emailOk ? '✅ Active' : '❌ Auth Failed';

  console.log(`\n  [ SYSTEM STATUS ]`);
  console.log(`  Database:   ${dbStatus}`);
  console.log(`  AI Engine:  ${aiStatus}`);
  console.log(`  Storage:    ${storageStatus}`);
  console.log(`  Email:      ${emailStatus}`);
  
  console.log(`\n  [ SERVER INFO ]`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Base URL:    http://localhost:${PORT}/api\n`);
});
