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
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data || null,
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

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createBulkNotifications,
  deleteOldNotifications
};
