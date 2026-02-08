/**
 * NOTIFICATION ROUTES
 * 
 * Routes for notification operations.
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationControllers/notification.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// User notification routes (all authenticated users)
router.get('/api/notifications', authenticate, notificationController.getUserNotifications);
router.get('/api/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/api/notifications/:notificationId/read', authenticate, notificationController.markAsRead);
router.put('/api/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/api/notifications/:notificationId', authenticate, notificationController.deleteNotification);

// Admin routes for creating notifications
router.post('/api/notifications', authenticate, requireAdmin, notificationController.createNotification);

module.exports = router;
