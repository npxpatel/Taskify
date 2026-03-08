const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

const { env }          = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes      = require('./routes/auth');
const jobRoutes       = require('./routes/jobs');
const taskRoutes      = require('./routes/tasks');
const templateRoutes  = require('./routes/templates');
const companyRoutes   = require('./routes/companies');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  const corsOrigins = env.CORS_ORIGINS.trim();
  app.use(
    cors({
      origin: corsOrigins === '*'
        ? (origin, cb) => cb(null, origin || '*')
        : corsOrigins.split(',').map((o) => o.trim()),
      credentials: true,
      methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // Strict rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      20,
    message:  { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders:   false,
  });

  // General API rate limit
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      200,
    message:  { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders:   false,
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth',      authLimiter, authRoutes);
  app.use('/api/jobs',      apiLimiter,  jobRoutes);
  app.use('/api/tasks',     apiLimiter,  taskRoutes);
  app.use('/api/templates', apiLimiter,  templateRoutes);
  app.use('/api/companies', apiLimiter,  companyRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
