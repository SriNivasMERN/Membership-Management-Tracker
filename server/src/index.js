import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createSuccessResponse } from './utils/response.js';
import apiRouter from './routes/index.js';
import { ensureDefaultSettings, seedDefaultPlans, seedDefaultSlots } from './utils/seedDefaults.js';

const app = express();

// Basic middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: clientOrigin,
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
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
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/membership_management_tracker';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed defaults (idempotent)
    await ensureDefaultSettings();
    await seedDefaultPlans();
    await seedDefaultSlots();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

export default app;

