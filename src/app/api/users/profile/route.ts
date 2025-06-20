import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';

// GET metodu - Kullanıcı profilini getir
export async function GET(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Kullanıcı profilini bul
    const userProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    // Görev istatistiklerini hesapla
    const totalTasks = await db.collection('tasks').countDocuments({
      userId: session.user.email
    });

    const completedTasks = await db.collection('tasks').countDocuments({
      userId: session.user.email,
      completed: true
    });

    // Eğer profil yoksa varsayılan oluştur
    if (!userProfile) {
      const defaultProfile = {
        email: session.user.email,
        name: session.user.name || 'Kullanıcı',
        preferences: {
          workingHours: '09:00-18:00',
          maxTasksPerDay: 5,
          notifications: true,
          aiSuggestions: true,
          theme: 'light'
        },
        stats: {
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('userProfiles').insertOne(defaultProfile);
      return NextResponse.json(defaultProfile);
    }

    // Mevcut profili güncelle
    const updatedStats = {
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    await db.collection('userProfiles').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          'stats': updatedStats,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      ...userProfile,
      stats: updatedStats
    });

  } catch (error) {
    console.error('Profil getirme hatası:', error);
    return NextResponse.json(
      { error: 'Profil bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

// PUT metodu - Kullanıcı profilini güncelle
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

    const { preferences, name } = await request.json();

    const client = await clientPromise;
    const db = client.db();

    // Profili güncelle
    const updateData: any = {
      updatedAt: new Date()
    };

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (name) {
      updateData.name = name;
    }

    const result = await db.collection('userProfiles').updateOne(
      { email: session.user.email },
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Profil başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Profil güncellenemedi' },
      { status: 500 }
    );
  }
} 