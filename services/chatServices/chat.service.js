/**
 * CHAT SERVICE
 * 
 * Handles all database operations for the live chat system
 */

const supabase = require('../../config/supabase');

class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(type, participantIds, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type,
          participants: participantIds,
          metadata,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ChatService] Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation between participants
   */
  async findConversation(participantIds) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', participantIds)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error('[ChatService] Error finding conversation:', error);
      return null;
    }
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(type, participantIds, metadata = {}) {
    try {
      // Try to find existing conversation
      let conversation = await this.findConversation(participantIds);

      // Create new if doesn't exist
      if (!conversation) {
        conversation = await this.createConversation(type, participantIds, metadata);
      }

      return conversation;
    } catch (error) {
      console.error('[ChatService] Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ChatService] Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, messageText, attachments = null) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message_text: messageText,
          attachments,
          read_by: [senderId] // Sender has read their own message
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('[ChatService] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ChatService] Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Get unread messages
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('conversation_id', conversationId)
        .not('read_by', 'cs', `{${userId}}`); // Not contains userId

      if (fetchError) throw fetchError;

      // Update each message
      for (const message of messages || []) {
        const updatedReadBy = [...(message.read_by || []), userId];
        
        await supabase
          .from('messages')
          .update({ read_by: updatedReadBy })
          .eq('id', message.id);
      }

      return { success: true, count: messages?.length || 0 };
    } catch (error) {
      console.error('[ChatService] Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', { user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('[ChatService] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Update typing indicator
   */
  async updateTypingIndicator(conversationId, userId, isTyping) {
    try {
      if (isTyping) {
        // Insert or update typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: userId,
            is_typing: true,
            last_typed_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Remove typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('[ChatService] Error updating typing indicator:', error);
      throw error;
    }
  }

  /**
   * Get typing users in conversation
   */
  async getTypingUsers(conversationId) {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('is_typing', true);

      if (error) throw error;
      return (data || []).map(row => row.user_id);
    } catch (error) {
      console.error('[ChatService] Error getting typing users:', error);
      return [];
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId, isOnline) {
    try {
      const { error } = await supabase
        .from('user_online_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[ChatService] Error updating online status:', error);
      throw error;
    }
  }

  /**
   * Get user online status
   */
  async getUserOnlineStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_online_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || { is_online: false };
    } catch (error) {
      console.error('[ChatService] Error getting online status:', error);
      return { is_online: false };
    }
  }
}

module.exports = new ChatService();
