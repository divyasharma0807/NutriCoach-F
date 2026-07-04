import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { debugLog } from './middleware/debugMiddleware.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import dietRoutes from './routes/dietRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import prospectRoutes from './routes/prospectRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow loading uploaded images/PDFs across domains
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', debugLog);
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/diet-plans', dietRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/admin', adminRoutes);

// Test API status
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NutriCoach API is running smoothly' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
