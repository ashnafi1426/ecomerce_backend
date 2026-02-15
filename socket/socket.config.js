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
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
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

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = verifyToken(token);

      // Get user from database
      const user = await userService.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status !== 'active') {
        return next(new Error('Authentication error: Account not active'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userEmail = user.email;
      socket.displayName = user.display_name;

      next();
    } catch (error) {
      console.error('[Socket.IO] Authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  console.log('[Socket.IO] Server initialized');
  return io;
}

module.exports = { initializeSocketServer };
