import { Notification, NotificationType } from './socket';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  private static notifications: Notification[] = [];

  // Yeni bildirim oluştur
  static createNotification(
    type: NotificationType,
    title: string,
    message: string,
    userId: string,
    data?: any
  ): Notification {
    const notification: Notification = {
      id: uuidv4(),
      type,
      title,
      message,
      userId,
      createdAt: new Date(),
      read: false,
      data
    };

    this.notifications.push(notification);
    return notification;
  }

  // Kullanıcının bildirimlerini getir
  static getUserNotifications(userId: string): Notification[] {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Bildirimi okundu olarak işaretle
  static markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  // Okunmamış bildirim sayısı
  static getUnreadCount(userId: string): number {
    return this.notifications.filter(
      notification => notification.userId === userId && !notification.read
    ).length;
  }

  // Görev ile ilgili bildirim mesajları
  static getTaskNotificationMessage(type: NotificationType, taskTitle: string): { title: string; message: string } {
    switch (type) {
      case 'task_completed':
        return {
          title: '✅ Görev Tamamlandı!',
          message: `"${taskTitle}" başarıyla tamamlandı`
        };
      case 'task_added':
        return {
          title: '📝 Yeni Görev Eklendi',
          message: `"${taskTitle}" görev listenize eklendi`
        };
      case 'deadline_warning':
        return {
          title: '⏰ Deadline Uyarısı',
          message: `"${taskTitle}" görevi için son tarih yaklaşıyor`
        };
      case 'ai_suggestion':
        return {
          title: '🤖 AI Önerisi Hazır',
          message: `"${taskTitle}" için AI önerileri oluşturuldu`
        };
      case 'task_assigned':
        return {
          title: '👥 Görev Atandı',
          message: `"${taskTitle}" görevi size atandı`
        };
      default:
        return {
          title: '📢 Bildirim',
          message: 'Yeni bir güncelleme var'
        };
    }
  }

  // Tüm bildirimleri temizle (test için)
  static clearAll(): void {
    this.notifications = [];
  }
} 