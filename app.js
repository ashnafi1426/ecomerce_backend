/**
 * EXPRESS APP CONFIGURATION
 * 
 * Production-ready Express application with security middleware,
 * rate limiting, and centralized error handling.
 */

const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

// Import centralized router (CommonJS module)
const router = require('./routes/index');

// Import job scheduler
const { initializeJobs } = require('./jobs/index');

dotenv.config();

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
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS Configuration - Allow frontend to access API
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ============================================
// BODY PARSING & LOGGING
// ============================================

// CRITICAL: Stripe webhook endpoint needs raw body for signature verification
// This middleware must come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging - DISABLED for performance
// Logging creates too much output and slows down the system
// Only log errors and important events
const skipMostRequests = (req, res) => {
  // Only log errors (4xx, 5xx status codes)
  return res.statusCode < 400;
};

// Disable HTTP request logging completely for better performance
// Uncomment below if you need error-only logging
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev', { skip: skipMostRequests }));
// } else {
//   app.use(morgan('combined', { skip: skipMostRequests }));
// }

// ============================================
// API ROUTES
// ============================================

// Root route - For Render health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FastShop E-Commerce API',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/health',
        api: '/api/v1'
      }
    }
  });
});

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

// ============================================
// BACKGROUND JOBS INITIALIZATION
// ============================================

// Initialize all scheduled jobs (cron jobs)
// This starts the automatic earnings processor and other background tasks
if (process.env.NODE_ENV !== 'test') {
  // Only run jobs in non-test environments
  initializeJobs();
  console.log('[App] Background jobs initialized');
}

module.exports = app;
