// ===========================================
// Server Entry Point
// Starts the Express server on configured port
// ===========================================

const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`\n🏛️  Municipal Helpdesk API Server`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port:        ${PORT}`);
  console.log(`   API Base:    http://localhost:${PORT}/api`);
  console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
});
