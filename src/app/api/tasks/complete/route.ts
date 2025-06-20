import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NotificationService } from '@/lib/notificationService';

// PUT metodu - Görevi tamamla/tamamlanmamış yap
export async function PUT(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // İstek gövdesinden görev ID ve durumunu al
    const { taskId, completed } = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Görev ID gerekli' },
        { status: 400 }
      );
    }
    
    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Önce görev bilgilerini al (bildirim için)
    const task = await tasksCollection.findOne({
      _id: new ObjectId(taskId),
      userId: session.user.email
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Görev bulunamadı veya güncelleme yetkiniz yok' },
        { status: 404 }
      );
    }

    // Görevi güncelle
    const result = await tasksCollection.updateOne(
      { 
        _id: new ObjectId(taskId),
        userId: session.user.email
      },
      { 
        $set: { 
          completed: completed === true,
          completedAt: completed === true ? new Date() : null,
          updatedAt: new Date()
        } 
      }
    );

    // Görev tamamlandıysa bildirim oluştur
    if (completed === true && !task.completed) {
      const { title: notificationTitle, message } = NotificationService.getTaskNotificationMessage('task_completed', task.title);
      const notification = NotificationService.createNotification(
        'task_completed',
        notificationTitle,
        message,
        session.user.email,
        { taskId: taskId }
      );
    }
    
    // Başarılı güncelleme mesajı döndür
    return NextResponse.json({
      message: completed ? 'Görev tamamlandı' : 'Görev tamamlanmamış olarak işaretlendi',
      completed: completed === true
    });

  } catch (error) {
    console.error('Görev tamamlama hatası:', error);
    return NextResponse.json(
      { error: 'Görev durumu güncellenemedi' },
      { status: 500 }
    );
  }
} 