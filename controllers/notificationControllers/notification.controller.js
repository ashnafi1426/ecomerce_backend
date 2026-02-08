/**
 * NOTIFICATION CONTROLLER
 * 
 * Handles HTTP requests for notification operations.
 */

const notificationService = require('../../services/notificationServices/notification.service');

/**
 * Get user notifications
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isRead, type, priority, limit } = req.query;
    
    const filters = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (limit) filters.limit = parseInt(limit);
    
    const notifications = await notificationService.getUserNotifications(userId, filters);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const count = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await notificationService.markAsRead(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const count = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    await notificationService.deleteNotification(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create notification (admin only)
 */
const createNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, data, priority } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, type, title, and message are required'
      });
    }
    
    const notification = await notificationService.createNotification(userId, {
      type,
      title,
      message,
      data,
      priority
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      notification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
