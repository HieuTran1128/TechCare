const { Server } = require('socket.io');
const Message = require('../models/message.model');

const onlineUsers = new Map(); // userId -> { userId, fullName, avatar, socketId }

/**
 * Tạo roomId duy nhất cho cuộc trò chuyện giữa hai người dùng (sắp xếp để đảm bảo nhất quán).
 */
function buildRoomId(userA, userB) {
  return [userA, userB].sort().join('__');
}

/**
 * Chuyển đổi document tin nhắn từ MongoDB sang định dạng gửi về client.
 */
function toClientMessage(doc) {
  return {
    id: String(doc._id),
    roomId: doc.roomId,
    senderId: doc.senderId,
    senderName: doc.senderName,
    senderAvatar: doc.senderAvatar,
    receiverId: doc.receiverId,
    receiverName: doc.receiverName,
    receiverAvatar: doc.receiverAvatar,
    text: doc.text,
    isRead: Boolean(doc.isRead),
    readAt: doc.readAt,
    createdAt: doc.createdAt,
  };
}

/**
 * Khởi tạo Socket.io server và đăng ký toàn bộ các sự kiện chat nội bộ.
 */
function createChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('register_user', async (user = {}) => {
      try {
        const userId = String(user.userId || '').trim();
        if (!userId) return;

        const profile = {
          userId,
          fullName: user.fullName?.trim() || `User ${userId}`,
          avatar: user.avatar || '',
          socketId: socket.id,
        };

        socket.data.user = profile;
        onlineUsers.set(userId, profile);

        io.emit('online_users', Array.from(onlineUsers.values()));

        const conversations = await Message.aggregate([
          {
            $match: {
              $or: [{ senderId: userId }, { receiverId: userId }],
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$roomId',
              lastMessage: { $first: '$$ROOT' },
              unreadCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$receiverId', userId] },
                        { $eq: ['$isRead', false] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { 'lastMessage.createdAt': -1 } },
          { $limit: 50 },
        ]);

        const summaries = conversations.map((item) => {
          const lm = item.lastMessage;
          const targetId = lm.senderId === userId ? lm.receiverId : lm.senderId;
          const target = onlineUsers.get(targetId);
          return {
            roomId: item._id,
            targetUserId: targetId,
            targetName:
              lm.senderId === userId ? lm.receiverName || target?.fullName || 'User' : lm.senderName,
            targetAvatar:
              lm.senderId === userId ? lm.receiverAvatar || target?.avatar || '' : lm.senderAvatar,
            lastMessage: {
              text: lm.text,
              senderId: lm.senderId,
              createdAt: lm.createdAt,
              isRead: lm.isRead,
            },
            unreadCount: item.unreadCount,
            online: Boolean(target),
          };
        });

        socket.emit('conversation_list', summaries);
      } catch (error) {
        console.error('register_user error:', error.message);
      }
    });

    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers.values()));
    });

    socket.on('join_private_chat', async ({ targetUserId, page = 1, pageSize = 20 } = {}) => {
      try {
        const currentUser = socket.data.user;
        if (!currentUser?.userId || !targetUserId) return;

        const roomId = buildRoomId(currentUser.userId, String(targetUserId));
        socket.join(roomId);

        const safePage = Math.max(1, Number(page) || 1);
        const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
        const skip = (safePage - 1) * safePageSize;

        const [docs, total] = await Promise.all([
          Message.find({ roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safePageSize)
            .lean(),
          Message.countDocuments({ roomId }),
        ]);

        const messages = docs.reverse().map(toClientMessage);

        socket.emit('private_chat_history', {
          roomId,
          page: safePage,
          pageSize: safePageSize,
          total,
          hasMore: skip + safePageSize < total,
          messages,
        });

        const readResult = await Message.updateMany(
          {
            roomId,
            receiverId: currentUser.userId,
            isRead: false,
          },
          {
            $set: { isRead: true, readAt: new Date() },
          }
        );

        if (readResult.modifiedCount > 0) {
          io.to(roomId).emit('messages_read', {
            roomId,
            readerId: currentUser.userId,
            readAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('join_private_chat error:', error.message);
      }
    });

    socket.on('private_message', async ({ receiverId, text } = {}) => {
      try {
        const currentUser = socket.data.user;
        const safeText = String(text || '').trim();

        if (!currentUser?.userId || !receiverId || !safeText) return;

        const safeReceiverId = String(receiverId);
        const roomId = buildRoomId(currentUser.userId, safeReceiverId);

        socket.join(roomId);

        const receiver = onlineUsers.get(safeReceiverId);
        if (receiver?.socketId) {
          io.sockets.sockets.get(receiver.socketId)?.join(roomId);
        }

        const saved = await Message.create({
          roomId,
          senderId: currentUser.userId,
          senderName: currentUser.fullName,
          senderAvatar: currentUser.avatar,
          receiverId: safeReceiverId,
          receiverName: receiver?.fullName || '',
          receiverAvatar: receiver?.avatar || '',
          text: safeText,
          isRead: false,
        });

        io.to(roomId).emit('private_message', toClientMessage(saved));
      } catch (error) {
        console.error('private_message error:', error.message);
      }
    });

    socket.on('mark_conversation_read', async ({ targetUserId } = {}) => {
      try {
        const currentUser = socket.data.user;
        if (!currentUser?.userId || !targetUserId) return;

        const roomId = buildRoomId(currentUser.userId, String(targetUserId));
        const readAt = new Date();

        const result = await Message.updateMany(
          {
            roomId,
            receiverId: currentUser.userId,
            isRead: false,
          },
          {
            $set: { isRead: true, readAt },
          }
        );

        if (result.modifiedCount > 0) {
          io.to(roomId).emit('messages_read', {
            roomId,
            readerId: currentUser.userId,
            readAt: readAt.toISOString(),
          });
        }
      } catch (error) {
        console.error('mark_conversation_read error:', error.message);
      }
    });

    socket.on('private_typing', ({ receiverId, isTyping } = {}) => {
      const currentUser = socket.data.user;
      if (!currentUser?.userId || !receiverId) return;

      const receiver = onlineUsers.get(String(receiverId));
      if (!receiver?.socketId) return;

      io.to(receiver.socketId).emit('private_typing', {
        senderId: currentUser.userId,
        senderName: currentUser.fullName,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('disconnect', () => {
      const currentUser = socket.data.user;
      if (!currentUser?.userId) return;

      onlineUsers.delete(currentUser.userId);
      io.emit('online_users', Array.from(onlineUsers.values()));
    });
  });

  return io;
}

module.exports = { createChatSocket };
