import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRouter from './routes/auth.routes';
import techRouter from './routes/tech.routes';
import reRouter from './routes/re.routes';
import trainingRouter from './routes/training.routes';
import coachingRouter from './routes/coaching.routes';
import adminRouter from './routes/admin.routes';
import expenseRouter from './routes/expense.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading of external/local images if needed
}));

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  process.env.CLIENT_URL || 'https://business-tracker-xi.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Login rate limiter: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', loginLimiter);

// Logger middleware for debugging
app.use((req, _res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Request] ${req.method} ${req.url}`);
  }
  next();
});

// Root check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'BusinessTracker API' });
});

// API-level health check (used by client keep-alive ping on startup)
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'BusinessTracker API', ts: Date.now() });
});

// Mounting Sub-routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tech', techRouter);
app.use('/api/v1/re', reRouter);
app.use('/api/v1/training', trainingRouter);
app.use('/api/v1/coaching', coachingRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/expenses', expenseRouter);

// Fallback Route
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'Resource API path not found.' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`⚡ BusinessTracker API Server running...`);
  console.log(`👉 Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`👉 CORS Origin: ${CLIENT_URL}`);
  console.log(`===============================================`);
});

export default app;
