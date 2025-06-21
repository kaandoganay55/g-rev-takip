"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple inline Progress component
const Progress = ({ value = 0, max = 100, className = "" }: { value?: number; max?: number; className?: string }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300"
      style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%` }}
    />
  </div>
);

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

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7'); // 7, 30, 90 days
  const [error, setError] = useState<string>('');

  // Session kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  // Analytics verilerini getir
  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session, timeRange]);

  /**
   * ============ ANALİTİK VERİLERİNİ GETİRME FONKSİYONU ============
   * Bu fonksiyon backend'den gerçek zamanlı analitik verileri getirir
   * 
   * API Endpoint: GET /api/analytics?range={timeRange}
   * Query Parameter:
   * - range: Analiz aralığı (7, 30, 90 gün)
   * 
   * Dönen veriler:
   * - Temel metrikler (toplam görev, tamamlanan, tamamlanma oranı)
   * - Kategori ve öncelik istatistikleri
   * - Günlük ve haftalık trendler
   * - Verimli saatler analizi
   * - Streak (kesintisiz gün) sayısı
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(''); // Önceki hataları temizle
      
      console.log(`📊 Analytics verileri getiriliyor (${timeRange} gün)...`);
      
      // Backend API'ye GET isteği gönder
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Cache kontrolü - her zaman fresh data al
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        // Başarılı yanıt alındı
        const data = await response.json();
        console.log('✅ Analytics verileri başarıyla getirildi:', data);
        
        // Veri doğrulama - temel alanların varlığını kontrol et
        if (typeof data.totalTasks !== 'number' || typeof data.completedTasks !== 'number') {
          throw new Error('Analytics verilerinde eksiklik var');
        }
        
        setAnalytics(data);
        
        // Meta bilgilerini logla
        if (data.dateRange) {
          console.log(`📅 Analiz aralığı: ${data.dateRange.start} - ${data.dateRange.end} (${data.dateRange.days} gün)`);
        }
        
      } else {
        // HTTP hata durumu
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Analytics API hatası:', response.status, errorData);
        setError(errorData.error || 'Analytics verileri yüklenemedi');
      }
    } catch (error) {
      // Network, parse veya validation hatası
      console.error('❌ Analytics fetch hatası:', error);
      setError('Analytics verileri alınırken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ============ VERİMLİLİK SKORU HESAPLAMA ============
   * Bu fonksiyon kullanıcının genel verimlilik skorunu hesaplar
   * 
   * Hesaplama formülü:
   * 1. Temel Skor = Tamamlanma oranı (0-100%)
   * 2. Streak Bonusu = Kesintisiz gün sayısı × 2 (maksimum 20 puan)
   * 3. Tutarlılık Bonusu = Haftalık trend ortalaması
   * 
   * Toplam skor = Min(Temel + Streak + Tutarlılık, 100)
   * 
   * @returns {number} 0-100 arası verimlilik skoru
   */
  const calculateProductivityScore = () => {
    if (!analytics) return 0;
    
    // 🎯 TEMEL SKOR: Tamamlanma oranından geliyor (%0-100)
    const baseScore = analytics.completionRate || 0;
    
    // 🔥 STREAK BONUSU: Her kesintisiz gün 2 puan (maksimum 20)
    // Örnek: 10 günlük streak = 20 puan bonus
    const streakBonus = Math.min((analytics.streakCount || 0) * 2, 20);
    
    // 📈 TUTARLILIK BONUSU: Haftalık trend ortalaması
    // Sürekli görev tamamlayan kullanıcılara bonus
    const weeklyAverage = analytics.weeklyTrend && analytics.weeklyTrend.length > 0 ? 
      analytics.weeklyTrend.reduce((sum, week) => sum + week, 0) / analytics.weeklyTrend.length : 0;
    const consistencyBonus = Math.min(weeklyAverage * 2, 15); // Maksimum 15 puan
    
    // 🏆 TOPLAM SKOR HESAPLAMA
    const totalScore = baseScore + streakBonus + consistencyBonus;
    
    // Debug bilgileri
    console.log('📊 Productivity Score Hesaplama:', {
      baseScore: Math.round(baseScore),
      streakBonus: Math.round(streakBonus),
      consistencyBonus: Math.round(consistencyBonus),
      totalScore: Math.round(totalScore)
    });
    
    // Maksimum 100 puan ile sınırla ve tam sayıya yuvarla
    return Math.min(Math.round(totalScore), 100);
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 90) return { level: 'Mükemmel', color: 'text-green-600', emoji: '🏆' };
    if (score >= 75) return { level: 'Harika', color: 'text-blue-600', emoji: '🚀' };
    if (score >= 60) return { level: 'İyi', color: 'text-yellow-600', emoji: '👍' };
    if (score >= 40) return { level: 'Orta', color: 'text-orange-600', emoji: '⚡' };
    return { level: 'Geliştirilmeli', color: 'text-red-600', emoji: '💪' };
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
          📊 Productivity Analytics
        </h1>
        <p className="text-gray-600 text-lg">Verimlilik istatistikleriniz ve analiz raporları</p>
        
        {/* Time Range Selector */}
        <div className="flex justify-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Zaman aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 Gün</SelectItem>
              <SelectItem value="30">Son 30 Gün</SelectItem>
              <SelectItem value="90">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* Productivity Score - Hero Card */}
          <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {getProductivityLevel(calculateProductivityScore()).emoji} Productivity Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {calculateProductivityScore()}
              </div>
              <div className={`text-xl font-semibold ${getProductivityLevel(calculateProductivityScore()).color}`}>
                {getProductivityLevel(calculateProductivityScore()).level}
              </div>
              <div className="text-gray-600">
                {analytics.streakCount} günlük seri devam ediyor! 🔥
              </div>
            </CardContent>
          </Card>

          {/* Main Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <span>📋</span>
                  <span>Toplam Görevler</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{analytics.totalTasks}</div>
                <div className="text-sm text-blue-600/70">
                  {timeRange} günlük dönemde
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <span>✅</span>
                  <span>Tamamlanan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{analytics.completedTasks}</div>
                <div className="text-sm text-green-600/70">
                  %{analytics.completionRate.toFixed(1)} başarı oranı
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-purple-700">
                  <span>⏱️</span>
                  <span>Ortalama Süre</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.avgCompletionTime.toFixed(1)}h
                </div>
                <div className="text-sm text-purple-600/70">
                  Görev tamamlama süresi
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <span>🔥</span>
                  <span>Seri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{analytics.streakCount}</div>
                <div className="text-sm text-orange-600/70">
                  Günlük tamamlama serisi
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category & Priority Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📁</span>
                  <span>Kategori Analizi</span>
                </CardTitle>
                <CardDescription>Görevlerinizin kategori dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="font-medium">{category || 'Kategorisiz'}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(count / analytics.totalTasks) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Öncelik Analizi</span>
                </CardTitle>
                <CardDescription>Görevlerinizin öncelik dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.priorityStats).map(([priority, count]) => {
                    const priorityColors: { [key: string]: string } = {
                      'acil': 'bg-red-600',
                      'yüksek': 'bg-orange-600',
                      'orta': 'bg-yellow-600',
                      'düşük': 'bg-green-600'
                    };
                    return (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="font-medium capitalize">{priority}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${priorityColors[priority] || 'bg-gray-600'} h-2 rounded-full`}
                              style={{
                                width: `${(count / analytics.totalTasks) * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productive Hours */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🕐</span>
                <span>En Verimli Saatleriniz</span>
              </CardTitle>
              <CardDescription>Hangi saatlerde daha çok görev tamamladığınız</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourStr = hour.toString().padStart(2, '0');
                  const taskCount = analytics.productiveHours[hourStr] || 0;
                  const maxTasks = Math.max(...Object.values(analytics.productiveHours));
                  const intensity = maxTasks > 0 ? (taskCount / maxTasks) : 0;
                  
                  return (
                    <div
                      key={hour}
                      className="flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      title={`${hourStr}:00 - ${taskCount} görev`}
                    >
                      <div className="text-xs font-medium text-gray-600">{hourStr}</div>
                      <div
                        className="w-4 h-8 rounded-sm mt-1 transition-all duration-300"
                        style={{
                          backgroundColor: intensity > 0 
                            ? `rgba(59, 130, 246, ${0.3 + intensity * 0.7})` 
                            : '#e5e7eb',
                        }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">{taskCount}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Hızlı Eylemler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => window.location.href = '/'}
                >
                  📋 Görevlere Dön
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/tools'}
                >
                  🛠️ Araçlar
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={fetchAnalytics}
                >
                  🔄 Yenile
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-500">
              Henüz analiz edilecek veri bulunmuyor. Birkaç görev ekleyin ve tekrar deneyin.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 