/**
 * SERVER ENTRY POINT
 * 
 * This file starts the Express server, handles graceful shutdown,
 * and manages unhandled errors.
 */

const dotenv = require('dotenv');
const app = require('./app');
const { testConnection } = require('./config/supabase');

dotenv.config();

const PORT = process.env.PORT || 5000;

// ============================================
// DATABASE CONNECTION TEST
// ============================================

// Test Supabase connection before starting server
testConnection()
  .then((connected) => {
    if (!connected && process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start server without database connection in production');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Database connection test failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// ============================================
// START SERVER
// ============================================

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🗄️  Database: Supabase`);
  console.log('='.repeat(60));
});

// ============================================
// SOCKET.IO INITIALIZATION
// ============================================

// Import Socket.IO modules (CommonJS modules)
const { initializeSocketServer } = require('./socket/socket.config');
const { initializeChatHandlers } = require('./socket/chat.handler');
const { initializeOrderTrackingHandlers } = require('./socket/order-tracking.handler');
const { setIOInstance } = require('./services/orderTrackingServices/websocket-instance');

// Initialize Socket.IO server
const io = initializeSocketServer(server);

// Set io instance for services to use
setIOInstance(io);

// Initialize chat event handlers
initializeChatHandlers(io);

// Initialize order tracking event handlers
initializeOrderTrackingHandlers(io);

console.log('💬 Socket.IO chat system initialized');
console.log('📦 Socket.IO order tracking system initialized');

// Export io instance for use in services
module.exports = { io };

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Track if shutdown is in progress to prevent duplicate signals
let isShuttingDown = false;

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\n⚠️  ${signal} received - shutting down gracefully...`);

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('❌ Forcefully shutting down');
    process.exit(1);
  }, 3000); // 3 seconds timeout

  // Close Socket.IO connections first
  if (io) {
    io.close(() => {
      // Then close HTTP server
      server.close(() => {
        clearTimeout(forceExitTimeout);
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } else {
    // If no Socket.IO, just close HTTP server
    server.close(() => {
      clearTimeout(forceExitTimeout);
      console.log('✅ Server closed');
      process.exit(0);
    });
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  if (!isShuttingDown) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  if (!isShuttingDown) {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  }
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
