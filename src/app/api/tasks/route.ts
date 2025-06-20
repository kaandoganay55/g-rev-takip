import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NotificationService } from '@/lib/notificationService';

// GET metodu - Kullanıcının görevlerini getir
export async function GET() {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Sadece kullanıcının görevlerini getir
    const tasks = await tasksCollection.find({ 
      userId: session.user.email 
    }).sort({ createdAt: -1 }).toArray();
    
    // Başarılı yanıt döndür
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    // Hata durumunda hata mesajı döndür
    console.error('Görevler getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Görevler getirilemedi' }, 
      { status: 500 }
    );
  }
}

// POST metodu - Yeni görev oluştur
export async function POST(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // İstek gövdesinden görev verilerini al
    const taskData = await request.json();
    
    // Yeni görev nesnesini oluştur
    const newTask = {
      ...taskData,
      userId: session.user.email,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Yeni görevi veritabanına ekle
    const result = await tasksCollection.insertOne(newTask);
    
    // Yeni görev bildirimini oluştur
    const { title: notificationTitle, message } = NotificationService.getTaskNotificationMessage('task_added', newTask.title);
    const notification = NotificationService.createNotification(
      'task_added',
      notificationTitle,
      message,
      session.user.email,
      { taskId: result.insertedId.toString() }
    );

    // Eğer socket server varsa, bildirim gönder
    try {
      // Socket.io server'a bildirim gönder (opsiyonel)
      // Bu kısım socket server çalışıyorsa bildirim gönderecek
    } catch (socketError) {
      console.log('Socket notification failed:', socketError);
    }
    
    // Eklenen görevin bilgilerini döndür
    return NextResponse.json(
      { _id: result.insertedId, ...newTask }, 
      { status: 201 }
    );
  } catch (error) {
    // Hata durumunda hata mesajı döndür
    console.error('Görev oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Görev oluşturulamadı' }, 
      { status: 500 }
    );
  }
}

// PUT metodu - Mevcut görevi güncelle
export async function PUT(request: NextRequest) {
  try {
    // İstek gövdesinden güncelleme verilerini al
    const { id, ...updateData } = await request.json();
    
    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Görevi güncelle
    await tasksCollection.updateOne(
      { _id: new ObjectId(id) }, 
      { $set: updateData }
    );
    
    // Başarılı güncelleme mesajı döndür
    return NextResponse.json(
      { message: 'Görev güncellendi' }, 
      { status: 200 }
    );
  } catch (error) {
    // Hata durumunda hata mesajı döndür
    console.error('Görev güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Görev güncellenemedi' }, 
      { status: 500 }
    );
  }
}

// DELETE metodu - Görevi sil
export async function DELETE(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // URL'den görev ID'sini al
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Görev ID gerekli' },
        { status: 400 }
      );
    }
    
    // MongoDB istemcisine bağlan
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Sadece kullanıcının kendi görevini silmesine izin ver
    const result = await tasksCollection.deleteOne({ 
      _id: new ObjectId(id),
      userId: session.user.email
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Görev bulunamadı veya silme yetkiniz yok' },
        { status: 404 }
      );
    }
    
    // Başarılı silme mesajı döndür
    return NextResponse.json(
      { message: 'Görev silindi' }, 
      { status: 200 }
    );
  } catch (error) {
    // Hata durumunda hata mesajı döndür
    console.error('Görev silinirken hata:', error);
    return NextResponse.json(
      { error: 'Görev silinemedi' }, 
      { status: 500 }
    );
  }
} 