/**
 * WEBSOCKET INSTANCE PROVIDER
 * 
 * Provides access to the Socket.IO instance for services
 * This module solves the circular dependency issue between server.js and services
 */

let ioInstance = null;

/**
 * Set the Socket.IO instance
 * Called from server.js after initialization
 * 
 * @param {Object} io - Socket.IO server instance
 */
function setIOInstance(io) {
  ioInstance = io;
}

/**
 * Get the Socket.IO instance
 * Returns null if not yet initialized
 * 
 * @returns {Object|null} Socket.IO server instance or null
 */
function getIOInstance() {
  return ioInstance;
}

module.exports = {
  setIOInstance,
  getIOInstance
};
