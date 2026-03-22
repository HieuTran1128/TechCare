import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import './ChatBox.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const PAGE_SIZE = 20;

type ChatUser = {
  userId: string;
  fullName: string;
  avatar?: string;
};

type PrivateMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  text: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

type ConversationSummary = {
  roomId: string;
  targetUserId: string;
  targetName: string;
  targetAvatar?: string;
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  online: boolean;
};

type ChatHistoryPayload = {
  roomId: string;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  messages: PrivateMessage[];
};

type ChatBoxProps = {
  currentUser: {
    userId: string;
    fullName: string;
    avatar?: string;
  };
};

type RoomMeta = {
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
};

const getRoomId = (a: string, b: string) => [a, b].sort().join('__');

const Avatar: React.FC<{ name: string; avatar?: string }> = ({ name, avatar }) => {
  if (avatar) return <img src={avatar} alt={name} className="avatar" />;
  return <div className="avatar avatar-fallback">{name.charAt(0).toUpperCase()}</div>;
};

export const ChatBox: React.FC<ChatBoxProps> = ({ currentUser }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const [conversationList, setConversationList] = useState<ConversationSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, PrivateMessage[]>>({});
  const [roomMeta, setRoomMeta] = useState<Record<string, RoomMeta>>({});
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const typingTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const selectedUser = useMemo(() => {
    const inOnline = onlineUsers.find((u) => u.userId === selectedUserId);
    if (inOnline) return inOnline;

    const inConversation = conversationList.find((c) => c.targetUserId === selectedUserId);
    if (inConversation) {
      return {
        userId: inConversation.targetUserId,
        fullName: inConversation.targetName,
        avatar: inConversation.targetAvatar,
      };
    }

    return undefined;
  }, [onlineUsers, conversationList, selectedUserId]);

  const currentRoomId = useMemo(() => {
    if (!selectedUserId) return '';
    return getRoomId(currentUser.userId, selectedUserId);
  }, [currentUser.userId, selectedUserId]);

  const currentMessages = useMemo(() => {
    if (!currentRoomId) return [];
    return messagesByRoom[currentRoomId] || [];
  }, [currentRoomId, messagesByRoom]);

  const currentRoomMeta = roomMeta[currentRoomId] || { page: 1, hasMore: false, loadingMore: false };

  const upsertConversation = (
    targetUserId: string,
    patch: Partial<ConversationSummary> & {
      roomId: string;
      targetName?: string;
      targetAvatar?: string;
      lastMessage?: ConversationSummary['lastMessage'];
    }
  ) => {
    setConversationList((prev) => {
      const idx = prev.findIndex((c) => c.targetUserId === targetUserId);
      if (idx >= 0) {
        const updated = { ...prev[idx], ...patch } as ConversationSummary;
        const next = [...prev];
        next[idx] = updated;
        next.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
        return next;
      }

      if (!patch.lastMessage) return prev;

      const created: ConversationSummary = {
        roomId: patch.roomId,
        targetUserId,
        targetName: patch.targetName || 'User',
        targetAvatar: patch.targetAvatar || '',
        lastMessage: patch.lastMessage,
        unreadCount: patch.unreadCount || 0,
        online: patch.online || false,
      };

      return [created, ...prev].sort(
        (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    });
  };

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    setSocket(s);

    s.on('connect', () => {
      s.emit('register_user', currentUser);
      s.emit('get_online_users');
    });

    s.on('online_users', (users: ChatUser[]) => {
      const filtered = users.filter((u) => u.userId !== currentUser.userId);
      setOnlineUsers(filtered);

      setConversationList((prev) =>
        prev.map((c) => ({
          ...c,
          online: filtered.some((u) => u.userId === c.targetUserId),
          targetAvatar: filtered.find((u) => u.userId === c.targetUserId)?.avatar || c.targetAvatar,
          targetName: filtered.find((u) => u.userId === c.targetUserId)?.fullName || c.targetName,
        }))
      );

      setSelectedUserId((prev) => {
        if (prev) return prev;
        return filtered[0]?.userId || '';
      });
    });

    s.on('conversation_list', (list: ConversationSummary[]) => {
      setConversationList(list);
      setSelectedUserId((prev) => prev || list[0]?.targetUserId || '');
    });

    s.on('private_chat_history', (payload: ChatHistoryPayload) => {
      const { roomId, page, hasMore, messages } = payload;

      setMessagesByRoom((prev) => {
        const old = prev[roomId] || [];
        if (page === 1) return { ...prev, [roomId]: messages };
        return { ...prev, [roomId]: [...messages, ...old] };
      });

      setRoomMeta((prev) => ({
        ...prev,
        [roomId]: { page, hasMore, loadingMore: false },
      }));
    });

    s.on('private_message', (message: PrivateMessage) => {
      setMessagesByRoom((prev) => {
        const old = prev[message.roomId] || [];
        return { ...prev, [message.roomId]: [...old, message] };
      });

      const targetUserId = message.senderId === currentUser.userId ? message.receiverId : message.senderId;
      const targetOnlineUser = onlineUsers.find((u) => u.userId === targetUserId);

      upsertConversation(targetUserId, {
        roomId: message.roomId,
        targetName:
          message.senderId === currentUser.userId
            ? message.receiverName || targetOnlineUser?.fullName || 'User'
            : message.senderName,
        targetAvatar:
          message.senderId === currentUser.userId
            ? message.receiverAvatar || targetOnlineUser?.avatar || ''
            : message.senderAvatar,
        lastMessage: {
          text: message.text,
          senderId: message.senderId,
          createdAt: message.createdAt,
          isRead: message.isRead,
        },
        unreadCount:
          message.receiverId === currentUser.userId && selectedUserId !== message.senderId
            ? (conversationList.find((c) => c.targetUserId === targetUserId)?.unreadCount || 0) + 1
            : 0,
      });

      if (message.senderId !== currentUser.userId) {
        setTypingMap((prev) => ({ ...prev, [message.senderId]: false }));
      }
    });

    s.on('messages_read', ({ roomId, readerId, readAt }: { roomId: string; readerId: string; readAt: string }) => {
      setMessagesByRoom((prev) => {
        const old = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: old.map((msg) => {
            if (msg.receiverId === readerId) {
              return { ...msg, isRead: true, readAt };
            }
            return msg;
          }),
        };
      });

      if (readerId === currentUser.userId) {
        setConversationList((prev) =>
          prev.map((c) => (c.roomId === roomId ? { ...c, unreadCount: 0 } : c))
        );
      }
    });

    s.on('private_typing', ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      setTypingMap((prev) => ({ ...prev, [senderId]: isTyping }));
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!socket || !selectedUserId) return;
    socket.emit('join_private_chat', { targetUserId: selectedUserId, page: 1, pageSize: PAGE_SIZE });
    socket.emit('mark_conversation_read', { targetUserId: selectedUserId });
    setConversationList((prev) =>
      prev.map((c) => (c.targetUserId === selectedUserId ? { ...c, unreadCount: 0 } : c))
    );
  }, [socket, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const loadMoreMessages = () => {
    if (!socket || !selectedUserId || !currentRoomMeta.hasMore || currentRoomMeta.loadingMore) return;

    const nextPage = currentRoomMeta.page + 1;
    setRoomMeta((prev) => ({
      ...prev,
      [currentRoomId]: {
        ...(prev[currentRoomId] || { page: 1, hasMore: true }),
        loadingMore: true,
      },
    }));

    const prevHeight = chatBodyRef.current?.scrollHeight || 0;

    socket.emit('join_private_chat', { targetUserId: selectedUserId, page: nextPage, pageSize: PAGE_SIZE });

    setTimeout(() => {
      const newHeight = chatBodyRef.current?.scrollHeight || 0;
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = newHeight - prevHeight;
      }
    }, 0);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleSend = () => {
    if (!socket || !selectedUserId) return;
    const text = messageInput.trim();
    if (!text) return;

    socket.emit('private_message', {
      receiverId: selectedUserId,
      text,
    });

    socket.emit('private_typing', { receiverId: selectedUserId, isTyping: false });
    setMessageInput('');
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);
    if (!socket || !selectedUserId) return;

    socket.emit('private_typing', { receiverId: selectedUserId, isTyping: true });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('private_typing', { receiverId: selectedUserId, isTyping: false });
    }, 900);
  };

  const sidebarList = useMemo(() => {
    const map = new Map<string, ConversationSummary>();
    conversationList.forEach((c) => map.set(c.targetUserId, c));

    onlineUsers.forEach((u) => {
      if (!map.has(u.userId)) {
        map.set(u.userId, {
          roomId: getRoomId(currentUser.userId, u.userId),
          targetUserId: u.userId,
          targetName: u.fullName,
          targetAvatar: u.avatar,
          lastMessage: {
            text: 'Chưa có tin nhắn',
            senderId: '',
            createdAt: new Date(0).toISOString(),
            isRead: true,
          },
          unreadCount: 0,
          online: true,
        });
      }
    });

    const normalized = searchTerm.trim().toLowerCase();

    return Array.from(map.values())
      .filter((item) => {
        if (!normalized) return true;
        return item.targetName.toLowerCase().includes(normalized);
      })
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [conversationList, onlineUsers, currentUser.userId, searchTerm]);

  const lastMyMessage = [...currentMessages].reverse().find((msg) => msg.senderId === currentUser.userId);
  const seenLabel =
    lastMyMessage && lastMyMessage.isRead && lastMyMessage.readAt
      ? `Đã xem ${new Date(lastMyMessage.readAt).toLocaleTimeString('vi-VN')}`
      : lastMyMessage
      ? 'Đã gửi'
      : '';

  return (
    <div className="messenger-shell">
      <aside className="messenger-sidebar">
        <h3>Đoạn chat</h3>
        <div className="search-box-wrap">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên..."
            className="search-box"
          />
        </div>
        <div className="user-list">
          {sidebarList.length === 0 && <div className="empty-user-search">Không tìm thấy người phù hợp.</div>}
          {sidebarList.map((item) => (
            <button
              key={item.targetUserId}
              className={`user-item ${selectedUserId === item.targetUserId ? 'active' : ''}`}
              onClick={() => handleSelectUser(item.targetUserId)}
            >
              <Avatar name={item.targetName} avatar={item.targetAvatar} />
              <div className="user-meta">
                <div className="user-name-row">
                  <div className="user-name">{item.targetName}</div>
                  {item.unreadCount > 0 && <span className="unread-badge">{item.unreadCount}</span>}
                </div>
                <div className="last-message">{item.lastMessage.text}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="messenger-main">
        {selectedUser ? (
          <>
            <div className="chat-topbar">
              <Avatar name={selectedUser.fullName} avatar={selectedUser.avatar} />
              <div>
                <div className="chat-name">{selectedUser.fullName}</div>
                <div className="chat-sub">
                  {typingMap[selectedUser.userId] ? 'đang nhập...' : selectedUser ? 'Online/Offline theo trạng thái thực tế' : ''}
                </div>
              </div>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
              {currentRoomMeta.hasMore && (
                <div className="load-more-wrap">
                  <button onClick={loadMoreMessages} disabled={currentRoomMeta.loadingMore} className="load-more-btn">
                    {currentRoomMeta.loadingMore ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
                  </button>
                </div>
              )}

              {currentMessages.map((msg) => {
                const mine = msg.senderId === currentUser.userId;
                return (
                  <div key={msg.id} className={`bubble-row ${mine ? 'mine' : ''}`}>
                    {!mine && <Avatar name={msg.senderName} avatar={msg.senderAvatar} />}
                    <div className={`bubble ${mine ? 'bubble-mine' : 'bubble-other'}`}>
                      <p>{msg.text}</p>
                      <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="seen-label">{seenLabel}</div>

            <div className="chat-input-wrap">
              <input
                value={messageInput}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={handleSend}>Gửi</button>
            </div>
          </>
        ) : (
          <div className="empty-chat">Chọn 1 người ở danh sách bên trái để bắt đầu chat 1-1.</div>
        )}
      </section>
    </div>
  );
};
