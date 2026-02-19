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

// Initialize Socket.IO server
const io = initializeSocketServer(server);

// Initialize chat event handlers
initializeChatHandlers(io);

console.log('💬 Socket.IO chat system initialized');

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  // Close server & exit process
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});
