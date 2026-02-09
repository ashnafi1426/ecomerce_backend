/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting for various API endpoints to prevent abuse
 * and ensure fair usage across all users.
 */

const rateLimit = require('express-rate-limit');

/**
 * Variant creation rate limiter
 * Limit: 100 requests per hour per seller
 */
const variantCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many variant creation requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user
    return req.user?.id || req.ip;
  }
});

/**
 * Coupon application rate limiter
 * Limit: 10 requests per minute per customer
 */
const couponApplicationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many coupon application attempts. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Rating submission rate limiter
 * Limit: 5 requests per minute per customer
 */
const ratingSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many rating submissions. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Image upload rate limiter
 * Limit: 20 requests per hour per user
 */
const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many image upload requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Login attempt rate limiter
 * Limit: 5 requests per minute per IP
 */
const loginAttemptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many login attempts. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    return req.ip;
  }
});

/**
 * General API rate limiter
 * Limit: 100 requests per minute per user
 */
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

module.exports = {
  variantCreationLimiter,
  couponApplicationLimiter,
  ratingSubmissionLimiter,
  imageUploadLimiter,
  loginAttemptLimiter,
  generalApiLimiter
};
