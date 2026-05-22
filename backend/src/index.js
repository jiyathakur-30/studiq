import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Rate Limiting (SaaS security standard)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'Operational',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Mounting Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/scheduler', schedulerRoutes);

// central error interceptors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 [Server] STUDIQ Operating System booted successfully on port ${PORT}`);
  console.log(`🎨 [Environment] Running in Mode: ${process.env.NODE_ENV || 'development'}`);
});
