/**
 * ============================================================================
 * ANALYTICS API - PRODUCTIVITY ANALYTICS BACKEND
 * ============================================================================
 * 
 * Bu API kullanıcının görev verilerini analiz ederek detaylı istatistikler üretir:
 * - Productivity score hesaplama
 * - Kategori ve öncelik analizi
 * - Verimli saatler analizi
 * - Günlük seri (streak) takibi
 * - Haftalık trend analizi
 * 
 * @requires MongoDB aggregation pipeline
 * @requires Time-based data analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  categoryStats: { [key: string]: number };
  priorityStats: { [key: string]: number };
  dailyCompletions: { date: string; count: number }[];
  weeklyTrend: number[];
  productiveHours: { [hour: string]: number };
  streakCount: number;
}

/**
 * ============ ANALİTİK VERİLERİ API ENDPOİNTİ ============
 * Bu dosya kullanıcının görev verilerini analiz edip
 * detaylı istatistikler sunan API'dir
 * 
 * Özellikler:
 * - Tamamlanma oranları hesaplama
 * - Kategori bazlı analiz
 * - Öncelik dağılımı analizi
 * - Haftalık trend analizi
 * - Verimli saat analizi
 * - Streak (kesintisiz gün) hesaplaması
 * 
 * Query Parameters:
 * - range: Analiz aralığı (7, 30, 90 gün)
 */

export async function GET(request: NextRequest) {
  try {
    // 🔐 GÜVENLİK KONTROLÜ: Kullanıcının oturum açmış olup olmadığını kontrol et
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim - Giriş yapmanız gerekiyor' }, 
        { status: 401 }
      );
    }

    // 📅 TARİH ARALIĞI BELİRLEME: Query parametresinden gün sayısını al
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '7');
    
    // Geçerli aralık kontrolü (7, 30 veya 90 gün)
    const validRanges = [7, 30, 90];
    const selectedRange = validRanges.includes(range) ? range : 7;
    
    // Analiz başlangıç tarihini hesapla
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - selectedRange);

    // 🗄️ VERİTABANI BAĞLANTISI
    const client = await clientPromise;
    const db = client.db();

    // 📊 TEMEL İSTATİSTİKLER HESAPLAMA
    console.log('📊 Kullanıcı analitik verileri hesaplanıyor:', session.user.email);

    // 1️⃣ TOPLAM GÖREV SAYISI (seçilen aralıkta)
    const totalTasks = await db.collection('tasks').countDocuments({
      userId: session.user.email,
      createdAt: { $gte: startDate }
    });

    // 2️⃣ TAMAMLANAN GÖREV SAYISI
    const completedTasks = await db.collection('tasks').countDocuments({
      userId: session.user.email,
      completed: true,
      completedAt: { $gte: startDate }
    });

    // 3️⃣ TAMAMLANMA ORANI HESAPLAMA
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 4️⃣ ORTALAMA TAMAMLAMA SÜRESİ HESAPLAMA
    // Tamamlanan görevlerin oluşturulma ve tamamlanma tarihleri arasındaki farkı hesapla
    const tasksWithCompletionTime = await db.collection('tasks').find({
      userId: session.user.email,
      completed: true,
      completedAt: { $gte: startDate, $exists: true },
      createdAt: { $exists: true }
    }).toArray();

    // Ortalama tamamlama süresini saat cinsinden hesapla
    let avgCompletionTime = 0;
    if (tasksWithCompletionTime.length > 0) {
      const totalCompletionTime = tasksWithCompletionTime.reduce((total, task) => {
        const createdAt = new Date(task.createdAt);
        const completedAt = new Date(task.completedAt);
        const diffHours = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return total + diffHours;
      }, 0);
      avgCompletionTime = totalCompletionTime / tasksWithCompletionTime.length;
    }

    // 5️⃣ KATEGORİ İSTATİSTİKLERİ
    // MongoDB aggregation ile kategori bazlı görev sayılarını hesapla
    const categoryStats = await db.collection('tasks').aggregate([
      { 
        $match: { 
          userId: session.user.email,
          createdAt: { $gte: startDate }
        } 
      },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } } // En çok kullanılan kategoriden sırala
    ]).toArray();

    // Kategori verilerini obje formatına dönüştür
    const categoryStatsObj: { [key: string]: number } = {};
    categoryStats.forEach(stat => {
      categoryStatsObj[stat._id || 'Kategorisiz'] = stat.count;
    });

    // 6️⃣ ÖNCELİK İSTATİSTİKLERİ
    const priorityStats = await db.collection('tasks').aggregate([
      { 
        $match: { 
          userId: session.user.email,
          createdAt: { $gte: startDate }
        } 
      },
      { 
        $group: { 
          _id: '$priority', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Öncelik verilerini obje formatına dönüştür
    const priorityStatsObj: { [key: string]: number } = {};
    priorityStats.forEach(stat => {
      priorityStatsObj[stat._id || 'Önceliksiz'] = stat.count;
    });

    // 7️⃣ GÜNLÜK TAMAMLAMA VERİLERİ (Son 7 gün için)
    const dailyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayCompletions = await db.collection('tasks').countDocuments({
        userId: session.user.email,
        completed: true,
        completedAt: { $gte: dayStart, $lte: dayEnd }
      });

      dailyCompletions.push({
        date: dayStart.toISOString().split('T')[0], // YYYY-MM-DD formatında
        count: dayCompletions
      });
    }

    // 8️⃣ HAFTALIK TREND ANALİZİ (Son 12 hafta)
    const weeklyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekCompletions = await db.collection('tasks').countDocuments({
        userId: session.user.email,
        completed: true,
        completedAt: { $gte: weekStart, $lte: weekEnd }
      });

      weeklyTrend.push(weekCompletions);
    }

    // 9️⃣ VERİMLİ SAATLER ANALİZİ
    // Tamamlanan görevlerin saatlerine göre dağılımı
    const productiveHours: { [hour: string]: number } = {};
    
    // 24 saat için sıfırla
    for (let hour = 0; hour < 24; hour++) {
      productiveHours[hour.toString().padStart(2, '0')] = 0;
    }

    // Tamamlanan görevlerin saatlerini say
    const completedTasksWithTime = await db.collection('tasks').find({
      userId: session.user.email,
      completed: true,
      completedAt: { $gte: startDate, $exists: true }
    }).toArray();

    completedTasksWithTime.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        const hourStr = hour.toString().padStart(2, '0');
        productiveHours[hourStr]++;
      }
    });

    // 🔥 STREAK (KESİNTİSİZ GÜN) HESAPLAMA
    // Son günden geriye doğru giderek kesintisiz tamamlama günlerini say
    let streakCount = 0;
    let checkDate = new Date();
    checkDate.setHours(23, 59, 59, 999);

    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayCompletions = await db.collection('tasks').countDocuments({
        userId: session.user.email,
        completed: true,
        completedAt: { $gte: dayStart, $lte: checkDate }
      });

      if (dayCompletions > 0) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Maksimum 365 gün kontrol et (sonsuz döngü önlemi)
        if (streakCount >= 365) break;
      } else {
        break;
      }
    }

    // 📦 ANALİTİK VERİLERİNİ PAKETLEME
    const analyticsData = {
      // Temel metrikler
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100, // 2 ondalık hassasiyet
      avgCompletionTime: Math.round(avgCompletionTime * 100) / 100, // Saat cinsinden
      
      // Kategori ve öncelik dağılımları
      categoryStats: categoryStatsObj,
      priorityStats: priorityStatsObj,
      
      // Zaman bazlı analizler
      dailyCompletions,
      weeklyTrend,
      productiveHours,
      
      // Gamification
      streakCount,
      
      // Meta bilgiler
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days: selectedRange
      }
    };

    console.log('✅ Analitik veriler başarıyla hesaplandı');
    return NextResponse.json(analyticsData);

  } catch (error) {
    // 🚨 HATA YÖNETİMİ: Detaylı hata loglama
    console.error('❌ Analytics API Hatası:', error);
    return NextResponse.json(
      { 
        error: 'Analytics verileri hesaplanırken hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Calculate productivity score based on multiple factors
 */
function calculateProductivityScore(analytics: TaskAnalytics): number {
  let score = 0;
  
  // Base score from completion rate (0-70 points)
  score += Math.min(analytics.completionRate * 0.7, 70);
  
  // Streak bonus (0-20 points)
  score += Math.min(analytics.streakCount * 2, 20);
  
  // Consistency bonus from weekly trend (0-10 points)
  if (analytics.weeklyTrend.length > 0) {
    const avgTrend = analytics.weeklyTrend.reduce((a, b) => a + b, 0) / analytics.weeklyTrend.length;
    score += Math.min(avgTrend * 0.1, 10);
  }
  
  return Math.min(Math.round(score), 100);
}

/**
 * Get productivity level based on score
 */
function getProductivityLevel(score: number): {
  level: string;
  color: string;
  emoji: string;
} {
  if (score >= 90) return { level: 'Mükemmel', color: 'green', emoji: '🏆' };
  if (score >= 75) return { level: 'Harika', color: 'blue', emoji: '🚀' };
  if (score >= 60) return { level: 'İyi', color: 'yellow', emoji: '👍' };
  if (score >= 40) return { level: 'Orta', color: 'orange', emoji: '⚡' };
  return { level: 'Geliştirilmeli', color: 'red', emoji: '💪' };
} 