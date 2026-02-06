/**
 * AUTHENTICATION ROUTES
 * 
 * Routes for user registration, login, and profile management.
 * Includes input validation and sanitization.
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authControllers/auth.controller');
const authenticate = require('../../middlewares/auth.middleware');
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
} = require('../../middlewares/validation.middleware');

// Public routes (with validation)
router.post(
  '/api/auth/register',
  sanitizeInput,
  validateRegistration,
  authController.register
);

router.post(
  '/api/auth/login',
  sanitizeInput,
  validateLogin,
  authController.login
);

// Protected routes (require authentication)
router.get('/api/auth/me', authenticate, authController.getProfile);

router.put(
  '/api/auth/profile',
  authenticate,
  sanitizeInput,
  validateProfileUpdate,
  authController.updateProfile
);

module.exports = router;
