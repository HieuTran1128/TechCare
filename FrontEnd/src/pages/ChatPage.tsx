import React from 'react';
import { ChatBox } from '../components/ChatBox';
import { useAuth } from '../context/AuthContext';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <ChatBox
        currentUser={{
          userId: user?.id || 'guest-id',
          fullName: user?.fullName || 'Guest',
          avatar: user?.avatar,
        }}
      />
    </div>
  );
};
