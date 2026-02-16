/**
 * SOCKET.IO SERVER CONFIGURATION
 * 
 * Configures Socket.IO server with authentication and CORS settings
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../config/jwt');
const userService = require('../services/userServices/user.service');

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
function initializeSocketServer(httpServer) {
  // Allow multiple frontend origins for development
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean); // Remove undefined values

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`[Socket.IO] Blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      console.log('[Socket.IO] Auth attempt - Token present:', !!token);

      if (!token) {
        const error = new Error('No token provided');
        error.data = { type: 'authentication_error' };
        return next(error);
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = verifyToken(token);
        console.log('[Socket.IO] Token verified for user:', decoded.userId);
      } catch (jwtError) {
        console.error('[Socket.IO] JWT verification failed:', jwtError.message);
        const error = new Error('Invalid or expired token');
        error.data = { type: 'authentication_error', reason: jwtError.message };
        return next(error);
      }

      // Get user from database
      const user = await userService.findById(decoded.userId);

      if (!user) {
        console.error('[Socket.IO] User not found:', decoded.userId);
        const error = new Error('User not found');
        error.data = { type: 'authentication_error' };
        return next(error);
      }

      if (user.status !== 'active') {
        console.error('[Socket.IO] User account not active:', user.id);
        const error = new Error('Account not active');
        error.data = { type: 'authentication_error' };
        return next(error);
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userEmail = user.email;
      socket.displayName = user.display_name;

      console.log('[Socket.IO] Authentication successful:', user.email, user.role);
      next();
    } catch (error) {
      console.error('[Socket.IO] Unexpected authentication error:', error);
      const authError = new Error('Authentication failed');
      authError.data = { type: 'authentication_error', details: error.message };
      next(authError);
    }
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

module.exports = { initializeSocketServer };
