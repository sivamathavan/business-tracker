import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRouter from './routes/auth.routes';
import techRouter from './routes/tech.routes';
import reRouter from './routes/re.routes';
import trainingRouter from './routes/training.routes';
import coachingRouter from './routes/coaching.routes';
import adminRouter from './routes/admin.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading of external/local images if needed
}));

app.use(cors({
  origin: true, // Reflects the request origin, great for local dev
  credentials: true, // Crucial for reading/writing httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Mounting Sub-routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tech', techRouter);
app.use('/api/v1/re', reRouter);
app.use('/api/v1/training', trainingRouter);
app.use('/api/v1/coaching', coachingRouter);
app.use('/api/v1/admin', adminRouter);

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
