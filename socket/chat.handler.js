/**
 * SOCKET.IO CHAT EVENT HANDLERS
 * 
 * Handles real-time chat events and messaging
 */

const chatService = require('../services/chatServices/chat.service');

/**
 * Initialize chat event handlers
 * @param {Object} io - Socket.IO server instance
 */
function initializeChatHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Chat] User connected: ${socket.userId} (${socket.userRole})`);

    // Update user online status
    chatService.updateOnlineStatus(socket.userId, true);

    // Join user's personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // ============================================
    // JOIN CONVERSATION
    // ============================================
    socket.on('chat:join', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const { data: conversation, error } = await require('../config/supabase')
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          return socket.emit('chat:error', { message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('chat:error', { message: 'Not authorized' });
        }

        // Join conversation room
        socket.join(`conversation:${conversationId}`);

        // Mark messages as read
        await chatService.markMessagesAsRead(conversationId, socket.userId);

        // Notify others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:user_joined', {
          userId: socket.userId,
          displayName: socket.displayName
        });

        socket.emit('chat:joined', { conversationId });
      } catch (error) {
        console.error('[Chat] Error joining conversation:', error);
        socket.emit('chat:error', { message: 'Failed to join conversation' });
      }
    });

    // ============================================
    // LEAVE CONVERSATION
    // ============================================
    socket.on('chat:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      
      socket.to(`conversation:${conversationId}`).emit('chat:user_left', {
        userId: socket.userId,
        displayName: socket.displayName
      });
    });

    // ============================================
    // SEND MESSAGE
    // ============================================
    socket.on('chat:send_message', async (data) => {
      try {
        const { conversationId, message, attachments } = data;

        // Verify user is participant
        const { data: conversation, error } = await require('../config/supabase')
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          return socket.emit('chat:error', { message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('chat:error', { message: 'Not authorized' });
        }

        // Save message to database
        const savedMessage = await chatService.sendMessage(
          conversationId,
          socket.userId,
          message,
          attachments
        );

        // Broadcast message to all participants in conversation
        io.to(`conversation:${conversationId}`).emit('chat:new_message', {
          ...savedMessage,
          senderName: socket.displayName,
          senderRole: socket.userRole
        });

        // Send notification to offline participants
        const offlineParticipants = conversation.participants.filter(
          id => id !== socket.userId
        );

        for (const participantId of offlineParticipants) {
          const status = await chatService.getUserOnlineStatus(participantId);
          if (!status.is_online) {
            // TODO: Send push notification or email
            console.log(`[Chat] Notify offline user ${participantId} about new message`);
          }
        }
      } catch (error) {
        console.error('[Chat] Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // ============================================
    // TYPING INDICATOR
    // ============================================
    socket.on('chat:typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;

        // Update typing indicator in database
        await chatService.updateTypingIndicator(conversationId, socket.userId, isTyping);

        // Broadcast to others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:user_typing', {
          userId: socket.userId,
          displayName: socket.displayName,
          isTyping
        });
      } catch (error) {
        console.error('[Chat] Error updating typing indicator:', error);
      }
    });

    // ============================================
    // MARK AS READ
    // ============================================
    socket.on('chat:mark_read', async (data) => {
      try {
        const { conversationId } = data;

        await chatService.markMessagesAsRead(conversationId, socket.userId);

        // Notify others that messages were read
        socket.to(`conversation:${conversationId}`).emit('chat:messages_read', {
          userId: socket.userId,
          conversationId
        });
      } catch (error) {
        console.error('[Chat] Error marking messages as read:', error);
      }
    });

    // ============================================
    // GET CONVERSATIONS
    // ============================================
    socket.on('chat:get_conversations', async () => {
      try {
        const conversations = await chatService.getUserConversations(socket.userId);
        socket.emit('chat:conversations', conversations);
      } catch (error) {
        console.error('[Chat] Error getting conversations:', error);
        socket.emit('chat:error', { message: 'Failed to get conversations' });
      }
    });

    // ============================================
    // GET MESSAGES
    // ============================================
    socket.on('chat:get_messages', async (data) => {
      try {
        const { conversationId, limit = 50, offset = 0 } = data;

        const messages = await chatService.getMessages(conversationId, limit, offset);
        socket.emit('chat:messages', { conversationId, messages });
      } catch (error) {
        console.error('[Chat] Error getting messages:', error);
        socket.emit('chat:error', { message: 'Failed to get messages' });
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`[Chat] User disconnected: ${socket.userId}`);
      
      // Update user online status
      await chatService.updateOnlineStatus(socket.userId, false);

      // Clear typing indicators
      // (handled automatically by database trigger after 10 seconds)
    });
  });

  console.log('[Chat] Event handlers initialized');
}

module.exports = { initializeChatHandlers };
