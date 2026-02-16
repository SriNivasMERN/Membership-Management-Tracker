import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createSuccessResponse } from './utils/response.js';
import apiRouter from './routes/index.js';
import {
  ensureDefaultSettings,
  ensureSystemState,
  seedDefaultPlans,
  seedDefaultSlots,
} from './utils/seedDefaults.js';

const app = express();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function assertSecurityEnv() {
  requiredEnv('MONGO_URI');
  requiredEnv('ACCESS_TOKEN_SECRET');
  requiredEnv('REFRESH_TOKEN_SECRET');
  requiredEnv('SETUP_TOKEN');
  requiredEnv('DEFAULT_ADMIN_EMAIL');
  if (process.env.NODE_ENV === 'production') {
    requiredEnv('CLIENT_ORIGIN');
  }
}

// Basic middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", ...parseAllowedOrigins()],
      },
    },
  })
);

const allowedOrigins = parseAllowedOrigins();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS blocked for origin'), false);
    },
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json(createSuccessResponse({ status: 'ok' }));
});

// API routes
app.use('/api', apiRouter);

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = requiredEnv('MONGO_URI');

async function start() {
  try {
    assertSecurityEnv();
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed defaults (idempotent)
    await ensureDefaultSettings();
    await ensureSystemState();
    await seedDefaultPlans();
    await seedDefaultSlots();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err.message);
    process.exit(1);
  }
}

start();

export default app;
