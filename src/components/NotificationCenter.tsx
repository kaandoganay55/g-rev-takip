"use client";

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type Notification } from '@/lib/socket';

const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, clearNotifications, isConnected, createTestNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'task_completed':
        return '✅';
      case 'task_added':
        return '📝';
      case 'deadline_warning':
        return '⏰';
      case 'ai_suggestion':
        return '🤖';
      case 'task_assigned':
        return '👥';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'task_completed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'task_added':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'deadline_warning':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'ai_suggestion':
        return 'bg-purple-100 border-purple-200 text-purple-800';
      case 'task_assigned':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} gün önce`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className={`ml-1 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                title={isConnected ? 'Bağlı' : 'Bağlantı kesildi'} />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🔔 Bildirimler</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} okunmamış</Badge>
              )}
            </span>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Canlı' : 'Offline'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔕</div>
              <p>Henüz bildirim yok</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {notifications.length} bildirim
                </span>
                                 <div className="flex space-x-2">
                   {notifications.length > 0 && (
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={clearNotifications}
                       className="text-xs text-red-600 hover:text-red-700"
                     >
                       Tümünü Temizle
                     </Button>
                   )}
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={createTestNotification}
                     className="text-xs text-blue-600 hover:text-blue-700"
                   >
                     Test Bildirimi
                   </Button>
                 </div>
              </div>
              
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read 
                      ? 'border-l-4 border-l-blue-500 bg-blue-50' 
                      : 'opacity-75'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        <span className="text-sm">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(new Date(notification.createdAt))}
                          </span>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getNotificationColor(notification.type)}`}
                          >
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenter; 