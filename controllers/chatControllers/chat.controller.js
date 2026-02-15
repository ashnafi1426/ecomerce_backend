/**
 * CHAT CONTROLLER
 * 
 * REST API endpoints for chat operations
 */

const chatService = require('../../services/chatServices/chat.service');
const userService = require('../../services/userServices/user.service');

class ChatController {
  /**
   * Create or get conversation
   * POST /api/chat/conversations
   */
  async createConversation(req, res, next) {
    try {
      const { participantId, type, metadata } = req.body;
      const currentUserId = req.user.id;

      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: 'Participant ID is required'
        });
      }

      // Verify participant exists
      const participant = await userService.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Participant not found'
        });
      }

      // Determine conversation type if not provided
      let conversationType = type;
      if (!conversationType) {
        if (req.user.role === 'customer' && participant.role === 'seller') {
          conversationType = 'customer_seller';
        } else if (req.user.role === 'customer' && ['admin', 'manager'].includes(participant.role)) {
          conversationType = 'customer_support';
        } else if (req.user.role === 'seller' && ['admin', 'manager'].includes(participant.role)) {
          conversationType = 'seller_support';
        } else {
          conversationType = 'internal';
        }
      }

      // Get or create conversation
      const participantIds = [currentUserId, participantId].sort();
      const conversation = await chatService.getOrCreateConversation(
        conversationType,
        participantIds,
        metadata || {}
      );

      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('[ChatController] Error creating conversation:', error);
      next(error);
    }
  }

  /**
   * Get user's conversations
   * GET /api/chat/conversations
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;

      const conversations = await chatService.getUserConversations(userId, limit);

      // Enrich with participant info
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const otherParticipantIds = conv.participants.filter(id => id !== userId);
          const participants = await Promise.all(
            otherParticipantIds.map(id => userService.findById(id))
          );

          return {
            ...conv,
            participantDetails: participants.map(p => ({
              id: p.id,
              displayName: p.display_name,
              email: p.email,
              role: p.role
            }))
          };
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedConversations
      });
    } catch (error) {
      console.error('[ChatController] Error getting conversations:', error);
      next(error);
    }
  }

  /**
   * Get conversation messages
   * GET /api/chat/conversations/:conversationId/messages
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Verify user is participant
      const { data: conversation, error } = await require('../../config/supabase')
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this conversation'
        });
      }

      const messages = await chatService.getMessages(conversationId, limit, offset);

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('[ChatController] Error getting messages:', error);
      next(error);
    }
  }

  /**
   * Send message (REST API fallback)
   * POST /api/chat/conversations/:conversationId/messages
   */
  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { message, attachments } = req.body;
      const userId = req.user.id;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      // Verify user is participant
      const { data: conversation, error } = await require('../../config/supabase')
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send messages in this conversation'
        });
      }

      const savedMessage = await chatService.sendMessage(
        conversationId,
        userId,
        message,
        attachments
      );

      res.status(201).json({
        success: true,
        data: savedMessage
      });
    } catch (error) {
      console.error('[ChatController] Error sending message:', error);
      next(error);
    }
  }

  /**
   * Mark messages as read
   * POST /api/chat/conversations/:conversationId/read
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const result = await chatService.markMessagesAsRead(conversationId, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[ChatController] Error marking as read:', error);
      next(error);
    }
  }

  /**
   * Get unread message count
   * GET /api/chat/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await chatService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('[ChatController] Error getting unread count:', error);
      next(error);
    }
  }

  /**
   * Get user online status
   * GET /api/chat/users/:userId/status
   */
  async getUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const status = await chatService.getUserOnlineStatus(userId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[ChatController] Error getting user status:', error);
      next(error);
    }
  }
}

module.exports = new ChatController();
