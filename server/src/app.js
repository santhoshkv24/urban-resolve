// ===========================================
// Express Application Setup
// Configures middleware, routes, and error handling
// ===========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');

// Import routes
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const directiveRoutes = require('./routes/directive.routes');
const officerRoutes = require('./routes/officer.routes');

const app = express();

// ---- Security Middleware ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ---- CORS Configuration ----
app.use(cors({
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ---- Body Parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Request Logging ----
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---- Static File Serving (Uploads) ----
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Municipal Helpdesk API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/directives', directiveRoutes);
app.use('/api/officer', officerRoutes);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
});

module.exports = app;
