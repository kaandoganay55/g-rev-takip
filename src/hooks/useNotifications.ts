"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { type Notification } from '@/lib/socket';

export const useNotifications = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Bildirimleri fetch et
  const fetchNotifications = async () => {
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Bildirimi okundu olarak işaretle
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

  // Bildirimi ekle (local test için)
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Browser bildirimi göster
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  // Tüm bildirimleri temizle
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Test bildirim oluştur
  const createTestNotification = () => {
    const testNotification: Notification = {
      id: Date.now().toString(),
      type: 'task_completed',
      title: '✅ Test Bildirimi',
      message: 'Bu bir test bildirimidir!',
      userId: session?.user?.email || '',
      createdAt: new Date(),
      read: false,
    };
    addNotification(testNotification);
  };

  // Browser bildirim izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // İlk yükleme ve periyodik fetch
  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications();
      
      // Her 30 saniyede bir kontrol et
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.email]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    addNotification,
    clearNotifications,
    createTestNotification,
    fetchNotifications,
    isConnected: true // Polling sistemi için her zaman true
  };
}; 