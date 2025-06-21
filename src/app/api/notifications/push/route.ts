/**
 * ============================================================================
 * PUSH NOTIFICATION API - BROWSER PUSH NOTIFICATIONS
 * ============================================================================
 * 
 * Web Push Notifications sistemi:
 * - Browser push subscriptions yönetimi
 * - Real-time bildirim gönderimi
 * - Kullanıcı preference yönetimi
 * - Notification scheduling
 * 
 * @requires web-push library
 * @requires VAPID keys configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import webpush from 'web-push';

// VAPID keys configuration
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * POST /api/notifications/push
 * Subscribe user for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, action } = await request.json();

    const client = await clientPromise;
    const db = client.db();
    const subscriptionsCollection = db.collection('pushSubscriptions');

    if (action === 'subscribe') {
      // Save push subscription
      await subscriptionsCollection.updateOne(
        { userId: session.user.email },
        {
          $set: {
            userId: session.user.email,
            subscription,
            createdAt: new Date(),
            isActive: true
          }
        },
        { upsert: true }
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'unsubscribe') {
      // Remove push subscription
      await subscriptionsCollection.updateOne(
        { userId: session.user.email },
        { $set: { isActive: false } }
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'send') {
      // Send notification to user
      const { title, body, icon, url } = await request.json();
      
      const userSubscription = await subscriptionsCollection.findOne({
        userId: session.user.email,
        isActive: true
      });

      if (!userSubscription) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        url: url || '/',
        tag: 'task-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'Görevi Gör',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Kapat',
            icon: '/icons/dismiss.png'
          }
        ]
      });

      await webpush.sendNotification(userSubscription.subscription, payload);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

/**
 * GET /api/notifications/push
 * Get VAPID public key for client-side subscription
 */
export async function GET() {
  return NextResponse.json({
    publicKey: vapidKeys.publicKey
  });
}

/**
 * PUT /api/notifications/push
 * Update notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();

    const client = await clientPromise;
    const db = client.db();
    const preferencesCollection = db.collection('notificationPreferences');

    await preferencesCollection.updateOne(
      { userId: session.user.email },
      {
        $set: {
          userId: session.user.email,
          ...preferences,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
} 