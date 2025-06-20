"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { type Notification } from '@/lib/socket';

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Socket bağlantısı kur
  useEffect(() => {
    if (session?.user?.email) {
      const socketInstance = io(process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || ''
        : 'http://localhost:3000', {
        path: '/api/socket'
      });

      socketInstance.on('connect', () => {
        console.log('🔌 Connected to socket server');
        setIsConnected(true);
        
        // Kullanıcı odasına katıl
        socketInstance.emit('join-user', session.user?.email);
      });

      socketInstance.on('disconnect', () => {
        console.log('📤 Disconnected from socket server');
        setIsConnected(false);
      });

      // Yeni bildirim geldiğinde
      socketInstance.on('notification', (notification: Notification) => {
        console.log('📢 New notification received:', notification);
        addNotification(notification);
        
        // Browser bildirimi göster
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      });

      setSocket(socketInstance);

      // Cleanup
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [session?.user?.email]);

  // Bildirim izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mevcut bildirimleri getir
  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications();
    }
  }, [session?.user?.email]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value: SocketContextType = {
    socket,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    clearNotifications,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 