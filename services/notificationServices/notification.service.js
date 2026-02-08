/**
 * NOTIFICATION SERVICE
 * 
 * Handles in-app notifications for all users.
 * Supports different notification types and priorities.
 */

const supabase = require('../../config/supabase');

/**
 * Create notification
 * 
 * @param {String} userId - User UUID
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (userId, notificationData) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      notification_type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      related_entity_type: notificationData.entityType || null,
      related_entity_id: notificationData.entityId || null,
      priority: notificationData.priority || 'normal'
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get user notifications
 * 
 * @param {String} userId - User UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of notifications
 */
const getUserNotifications = async (userId, filters = {}) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Mark notification as read
 * 
 * @param {String} notificationId - Notification UUID
 * @param {String} userId - User UUID (for authorization)
 * @returns {Promise<Object>} Updated notification
 */
const markAsRead = async (notificationId, userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Mark all notifications as read
 * 
 * @param {String} userId - User UUID
 * @returns {Promise<Number>} Number of notifications marked as read
 */
const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();
  
  if (error) throw error;
  
  return data ? data.length : 0;
};

/**
 * Delete notification
 * 
 * @param {String} notificationId - Notification UUID
 * @param {String} userId - User UUID (for authorization)
 * @returns {Promise<Boolean>} Success status
 */
const deleteNotification = async (notificationId, userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return true;
};

/**
 * Get unread notification count
 * 
 * @param {String} userId - User UUID
 * @returns {Promise<Number>} Count of unread notifications
 */
const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  
  return count || 0;
};

/**
 * Create bulk notifications
 * 
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Array>} Created notifications
 */
const createBulkNotifications = async (notifications) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Delete old notifications (cleanup)
 * 
 * @param {Number} daysOld - Delete notifications older than this many days
 * @returns {Promise<Number>} Number of deleted notifications
 */
const deleteOldNotifications = async (daysOld = 30) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', cutoffDate)
    .eq('is_read', true)
    .select();
  
  if (error) throw error;
  
  return data ? data.length : 0;
};

// ============================================
// CRITICAL FEATURES NOTIFICATIONS
// ============================================

/**
 * Notify customer about delivery rating submission
 * Implements Requirement 3.5
 * @param {String} customerId - Customer UUID
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Created notification
 */
const notifyDeliveryRatingSubmitted = async (customerId, orderId) => {
  return await createNotification(customerId, {
    type: 'new_review',
    title: 'Delivery Rating Submitted',
    message: 'Thank you for rating your delivery experience!',
    entityType: 'order',
    entityId: orderId,
    priority: 'normal'
  });
};

/**
 * Notify seller about low delivery rating
 * Implements Requirement 3.5
 * @param {String} sellerId - Seller UUID
 * @param {String} orderId - Order UUID
 * @param {Number} rating - Rating value
 * @returns {Promise<Object>} Created notification
 */
const notifySellerLowDeliveryRating = async (sellerId, orderId, rating) => {
  return await createNotification(sellerId, {
    type: 'new_review',
    title: 'Low Delivery Rating Received',
    message: `You received a ${rating}-star delivery rating. Please review your delivery process.`,
    entityType: 'order',
    entityId: orderId,
    priority: 'high'
  });
};

/**
 * Notify customer about replacement request received
 * Implements Requirement 4.4
 * @param {String} customerId - Customer UUID
 * @param {String} replacementId - Replacement request UUID
 * @returns {Promise<Object>} Created notification
 */
const notifyReplacementRequestReceived = async (customerId, replacementId) => {
  return await createNotification(customerId, {
    type: 'return_requested',
    title: 'Replacement Request Received',
    message: 'Your replacement request has been received and is being reviewed.',
    entityType: 'replacement',
    entityId: replacementId,
    priority: 'normal'
  });
};

/**
 * Notify customer about replacement request approval
 * Implements Requirement 4.4
 * @param {String} customerId - Customer UUID
 * @param {String} replacementId - Replacement request UUID
 * @returns {Promise<Object>} Created notification
 */
const notifyReplacementApproved = async (customerId, replacementId) => {
  return await createNotification(customerId, {
    type: 'return_approved',
    title: 'Replacement Request Approved',
    message: 'Your replacement request has been approved. Your replacement will be shipped soon.',
    entityType: 'replacement',
    entityId: replacementId,
    priority: 'high'
  });
};

/**
 * Notify customer about replacement request rejection
 * Implements Requirement 4.4
 * @param {String} customerId - Customer UUID
 * @param {String} replacementId - Replacement request UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Created notification
 */
const notifyReplacementRejected = async (customerId, replacementId, reason) => {
  return await createNotification(customerId, {
    type: 'return_rejected',
    title: 'Replacement Request Rejected',
    message: `Your replacement request was rejected. Reason: ${reason}`,
    entityType: 'replacement',
    entityId: replacementId,
    priority: 'high'
  });
};

/**
 * Notify customer about replacement shipment
 * Implements Requirement 4.10
 * @param {String} customerId - Customer UUID
 * @param {String} replacementId - Replacement request UUID
 * @param {String} trackingNumber - Tracking number
 * @returns {Promise<Object>} Created notification
 */
const notifyReplacementShipped = async (customerId, replacementId, trackingNumber) => {
  return await createNotification(customerId, {
    type: 'order_shipped',
    title: 'Replacement Shipped',
    message: `Your replacement has been shipped. Tracking: ${trackingNumber}`,
    entityType: 'replacement',
    entityId: replacementId,
    priority: 'normal'
  });
};

/**
 * Notify seller about replacement request
 * Implements Requirement 4.4
 * @param {String} sellerId - Seller UUID
 * @param {String} replacementId - Replacement request UUID
 * @param {String} productTitle - Product title
 * @returns {Promise<Object>} Created notification
 */
const notifySellerReplacementRequest = async (sellerId, replacementId, productTitle) => {
  return await createNotification(sellerId, {
    type: 'return_requested',
    title: 'New Replacement Request',
    message: `A customer has requested a replacement for: ${productTitle}`,
    entityType: 'replacement',
    entityId: replacementId,
    priority: 'high'
  });
};

/**
 * Notify customer about refund request received
 * Implements Requirement 5.13
 * @param {String} customerId - Customer UUID
 * @param {String} refundId - Refund request UUID
 * @returns {Promise<Object>} Created notification
 */
const notifyRefundRequestReceived = async (customerId, refundId) => {
  return await createNotification(customerId, {
    type: 'return_requested',
    title: 'Refund Request Received',
    message: 'Your refund request has been received and is being reviewed.',
    entityType: 'refund',
    entityId: refundId,
    priority: 'normal'
  });
};

/**
 * Notify customer about refund approval
 * Implements Requirement 5.13
 * @param {String} customerId - Customer UUID
 * @param {String} refundId - Refund request UUID
 * @param {Number} amount - Refund amount
 * @returns {Promise<Object>} Created notification
 */
const notifyRefundApproved = async (customerId, refundId, amount) => {
  return await createNotification(customerId, {
    type: 'return_approved',
    title: 'Refund Approved',
    message: `Your refund of $${(amount / 100).toFixed(2)} has been approved and will be processed soon.`,
    entityType: 'refund',
    entityId: refundId,
    priority: 'high'
  });
};

/**
 * Notify customer about refund completion
 * Implements Requirement 5.21
 * @param {String} customerId - Customer UUID
 * @param {String} refundId - Refund request UUID
 * @param {Number} amount - Refund amount
 * @returns {Promise<Object>} Created notification
 */
const notifyRefundCompleted = async (customerId, refundId, amount) => {
  return await createNotification(customerId, {
    type: 'refund_processed',
    title: 'Refund Completed',
    message: `Your refund of $${(amount / 100).toFixed(2)} has been processed successfully.`,
    entityType: 'refund',
    entityId: refundId,
    priority: 'high'
  });
};

/**
 * Notify seller about refund request
 * Implements Requirement 5.13
 * @param {String} sellerId - Seller UUID
 * @param {String} refundId - Refund request UUID
 * @param {Number} amount - Refund amount
 * @returns {Promise<Object>} Created notification
 */
const notifySellerRefundRequest = async (sellerId, refundId, amount) => {
  return await createNotification(sellerId, {
    type: 'return_requested',
    title: 'New Refund Request',
    message: `A customer has requested a refund of $${(amount / 100).toFixed(2)}.`,
    entityType: 'refund',
    entityId: refundId,
    priority: 'high'
  });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createBulkNotifications,
  deleteOldNotifications,
  // Critical features notifications
  notifyDeliveryRatingSubmitted,
  notifySellerLowDeliveryRating,
  notifyReplacementRequestReceived,
  notifyReplacementApproved,
  notifyReplacementRejected,
  notifyReplacementShipped,
  notifySellerReplacementRequest,
  notifyRefundRequestReceived,
  notifyRefundApproved,
  notifyRefundCompleted,
  notifySellerRefundRequest
};

