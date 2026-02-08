/**
 * EXPRESS APP CONFIGURATION
 * 
 * Production-ready Express application with security middleware,
 * rate limiting, and centralized error handling.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

// Import centralized router
const router = require('./routes');

// Import error middleware
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Compression - Compress response bodies
app.use(compression());

// Rate Limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// CORS CONFIGURATION
// ============================================

// CORS - Allow frontend to call backend
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined values
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// ============================================
// BODY PARSING & LOGGING
// ============================================

// CRITICAL: Stripe webhook endpoint needs raw body for signature verification
// This middleware must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// API ROUTES
// ============================================

// Health check endpoint - API v1
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Server is running',
    data: {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    }
  });
});

// Legacy health check (backward compatibility)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API v1 info endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-Commerce API v1',
    data: {
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/auth',
        products: '/api/products',
        orders: '/api/orders',
        admin: '/api/admin'
      }
    }
  });
});

// Use centralized router for all API routes
app.use(router);

// 404 handler - Route not found
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode
    });
  }

  // Send error response
  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
