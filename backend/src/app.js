const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const testRoutes = require('./routes/testRoutes');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const branchRoutes = require('./routes/branchRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminKycRoutes = require('./routes/adminKycRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// ============================================
// SECURITY
// ============================================
app.use(helmet());

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.0.224:5173',
  'https://udrive-bd-frontend.vercel.app',
  'https://sandbox.sslcommerz.com',
  'https://securepay.sslcommerz.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === 'null' || origin === 'undefined') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('❌ CORS blocked origin:', origin);
      return callback(null, true);
    },

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
  })
);

// ============================================
// BODY PARSING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// COOKIE PARSER
// ============================================
app.use(cookieParser());

// ============================================
// ROOT & HEALTH CHECK ROUTES
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UDrive Bangladesh Backend is running successfully!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UDrive Bangladesh API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/test', testRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin/kyc', adminKycRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

// ============================================
// 404 NOT FOUND HANDLER
// ============================================
app.use((req, res, next) => {
  next(
    ApiError.notFound(
      `Route not found: ${req.originalUrl}`
    )
  );
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

module.exports = app;