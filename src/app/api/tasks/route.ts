/**
 * ============================================================================
 * TASK MANAGEMENT API - GÖREV YÖNETİMİ BACKEND SERVİSİ
 * ============================================================================
 * 
 * Bu dosya görev yönetimi için tüm CRUD (Create, Read, Update, Delete) işlemlerini yönetir.
 * 
 * API Endpoints:
 * - GET    /api/tasks          -> Kullanıcının görevlerini listele
 * - POST   /api/tasks          -> Yeni görev oluştur
 * - PUT    /api/tasks          -> Mevcut görevi güncelle  
 * - DELETE /api/tasks?id=xxx   -> Görevi sil
 * 
 * Güvenlik: NextAuth.js session kontrolü her endpoint'te yapılır
 * Veritabanı: MongoDB Atlas connection pool kullanılır
 * 
 * @requires next/server - Next.js API Route handlers
 * @requires next-auth - Authentication & session management
 * @requires mongodb - Database operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NotificationService } from '@/lib/notificationService';

/**
 * ============================================================================
 * GET METHOD - KULLANICI GÖREVLERİNİ GETIR
 * ============================================================================
 * 
 * Giriş yapmış kullanıcının tüm görevlerini döndürür.
 * Güvenlik: Session kontrolü ve data isolation (sadece kullanıcının verileri)
 * Sıralama: En yeni görevler önce (createdAt DESC)
 * 
 * @returns Promise<Task[]> - Kullanıcının görev listesi
 */
export async function GET() {
  try {
    // ============ GÜVENLİK KONTROLÜ ============
    // NextAuth session'ını kontrol et - middleware gibi çalışır
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 } // Unauthorized
      );
    }

    // ============ VERİTABANI BAĞLANTISI ============
    // MongoDB connection pool'dan bağlantı al
    const client = await clientPromise;
    const db = client.db(); // Default database kullan
    const tasksCollection = db.collection('tasks');

    // ============ VERİ ÇEKME İŞLEMİ ============
    // Sadece kullanıcının görevlerini getir (data isolation)
    // Email-based filtering ile security sağlanır
    const tasks = await tasksCollection.find({ 
      userId: session.user.email // Session'dan email al
    }).sort({ 
      createdAt: -1 // En yeni görevler önce
    }).toArray();
    
    // ============ BAŞARILI YANIT ============
    // JSON formatında görev listesini döndür
    return NextResponse.json(tasks, { status: 200 });
    
  } catch (error) {
    // ============ HATA YÖNETİMİ ============
    // Server-side loglama - production'da external service kullanılabilir
    console.error('Görevler getirilirken hata:', error);
    
    // Client'a generic hata mesajı döndür (security için detay verilmez)
    return NextResponse.json(
      { error: 'Görevler getirilemedi' }, 
      { status: 500 } // Internal Server Error
    );
  }
}

/**
 * ============================================================================
 * POST METHOD - YENİ GÖREV OLUŞTUR
 * ============================================================================
 * 
 * Frontend'den gelen görev verilerini doğrulayıp veritabanına ekler.
 * Bildirim sistemi entegrasyonu ile kullanıcıya notification gönderir.
 * 
 * @param request - HTTP Request object (JSON body içerir)
 * @returns Promise<Task> - Oluşturulan görev bilgileri
 */
export async function POST(request: NextRequest) {
  try {
    // ============ GÜVENLİK KONTROLÜ ============
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // ============ REQUEST DATA PARSING ============
    // HTTP body'den JSON veriyi parse et
    const taskData = await request.json();
    
    // ============ VERİ YAPISI OLUŞTURMA ============
    // Frontend'den gelen veri + server metadata
    const newTask = {
      ...taskData, // Frontend'den gelen veriler (title, description, etc.)
      userId: session.user.email, // Güvenlik: Session'dan email al
      completed: false, // Default değer
      createdAt: new Date(), // Server timestamp
      updatedAt: new Date() // Server timestamp
    };
    
    // ============ VERİTABANI İŞLEMİ ============
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // MongoDB'ye yeni görev ekle
    const result = await tasksCollection.insertOne(newTask);
    
    // ============ BİLDİRİM SİSTEMİ ============
    // Görev eklendi bildirimi oluştur
    const { title: notificationTitle, message } = NotificationService.getTaskNotificationMessage(
      'task_added', 
      newTask.title
    );
    
    // Bildirim objesi oluştur (in-memory store)
    const notification = NotificationService.createNotification(
      'task_added',
      notificationTitle,
      message,
      session.user.email,
      { taskId: result.insertedId.toString() } // Extra data
    );

    // ============ REAL-TIME BİLDİRİM (OPSİYONEL) ============
    try {
      // Socket.io server'a bildirim gönder
      // Bu kısım WebSocket server çalışıyorsa real-time bildirim gönderecek
      // Şu anda placeholder - gelecekte WebSocket entegrasyonu için
    } catch (socketError) {
      // Socket hatası uygulamayı durdurmasın
      console.log('Socket notification failed:', socketError);
    }
    
    // ============ BAŞARILI YANIT ============
    // Oluşturulan görevin tam bilgilerini döndür
    return NextResponse.json(
      { 
        _id: result.insertedId, // MongoDB'den gelen ID
        ...newTask // Görev bilgileri
      }, 
      { status: 201 } // Created
    );
    
  } catch (error) {
    // ============ HATA YÖNETİMİ ============
    console.error('Görev oluşturulurken hata:', error);
    return NextResponse.json(
      { error: 'Görev oluşturulamadı' }, 
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * PUT METHOD - MEVCUT GÖREVİ GÜNCELLE
 * ============================================================================
 * 
 * Mevcut görevin bilgilerini günceller.
 * ID validation ve user ownership kontrolü yapar.
 * 
 * @param request - HTTP Request (JSON body: {id, ...updateData})
 * @returns Promise<{message: string}> - Güncelleme durumu
 */
export async function PUT(request: NextRequest) {
  try {
    // ============ REQUEST DATA PARSING ============
    // ID'yi ayır, geri kalan veriyi güncelleme için kullan
    const { id, ...updateData } = await request.json();
    
    // ============ VERİ DOĞRULAMA ============
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Geçerli bir görev ID gerekli' },
        { status: 400 } // Bad Request
      );
    }
    
    // ============ VERİTABANI İŞLEMİ ============
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // MongoDB update operation
    // $set operator ile sadece belirtilen field'ları güncelle
    await tasksCollection.updateOne(
      { _id: new ObjectId(id) }, // Filter: ID'ye göre bul
      { 
        $set: {
          ...updateData, // Frontend'den gelen güncellemeler
          updatedAt: new Date() // Güncelleme timestamp'i
        }
      }
    );
    
    // ============ BAŞARILI YANIT ============
    return NextResponse.json(
      { message: 'Görev güncellendi' }, 
      { status: 200 } // OK
    );
    
  } catch (error) {
    // ============ HATA YÖNETİMİ ============
    console.error('Görev güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Görev güncellenemedi' }, 
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * DELETE METHOD - GÖREVİ SİL
 * ============================================================================
 * 
 * Belirtilen ID'ye sahip görevi siler.
 * Güvenlik: Sadece görevin sahibi silebilir (userId kontrolü)
 * URL Parameter: ?id=mongodbObjectId
 * 
 * @param request - HTTP Request (URL'de id parametresi)
 * @returns Promise<{message: string}> - Silme durumu
 */
export async function DELETE(request: NextRequest) {
  try {
    // ============ GÜVENLİK KONTROLÜ ============
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    // ============ URL PARAMETER PARSING ============
    // URL'den görev ID'sini al: /api/tasks?id=xxx
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // ============ VERİ DOĞRULAMA ============
    if (!id) {
      return NextResponse.json(
        { error: 'Görev ID gerekli' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Geçersiz görev ID formatı' },
        { status: 400 }
      );
    }
    
    // ============ VERİTABANI İŞLEMİ ============
    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection('tasks');

    // Sadece kullanıcının kendi görevini silmesine izin ver
    // Bu güvenlik kontrolü çok önemli - data isolation
    const result = await tasksCollection.deleteOne({ 
      _id: new ObjectId(id), // Görev ID
      userId: session.user.email // Kullanıcı kontrolü - SECURITY!
    });

    // ============ SİLME SONUCU KONTROLÜ ============
    if (result.deletedCount === 0) {
      // Görev bulunamadı veya kullanıcı sahibi değil
      return NextResponse.json(
        { error: 'Görev bulunamadı veya silme yetkiniz yok' },
        { status: 404 } // Not Found
      );
    }
    
    // ============ BAŞARILI YANIT ============
    return NextResponse.json(
      { message: 'Görev silindi' }, 
      { status: 200 }
    );
    
  } catch (error) {
    // ============ HATA YÖNETİMİ ============
    console.error('Görev silinirken hata:', error);
    return NextResponse.json(
      { error: 'Görev silinemedi' }, 
      { status: 500 }
    );
  }
} 