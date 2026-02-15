/**
 * CHAT ROUTES
 * 
 * REST API routes for chat operations
 */

const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatControllers/chat.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All chat routes require authentication
router.use(authenticate);

// Conversations
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/read', chatController.markAsRead);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

// User status
router.get('/users/:userId/status', chatController.getUserStatus);

module.exports = router;
