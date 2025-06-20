import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NotificationService } from '@/lib/notificationService';

// Kullanıcının bildirimlerini getir
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.email;
    const notifications = NotificationService.getUserNotifications(userId);
    const unreadCount = NotificationService.getUnreadCount(userId);

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Bildirimi okundu olarak işaretle
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const success = NotificationService.markAsRead(notificationId);
    
    if (!success) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 