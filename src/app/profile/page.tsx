"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Simple inline components
const Label = ({ children, htmlFor, className = "" }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
    {children}
  </label>
);

const Progress = ({ value = 0, max = 100, className = "" }: { value?: number; max?: number; className?: string }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300"
      style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%` }}
    />
  </div>
);

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  xpToNext: number;
  achievements: Achievement[];
  stats: UserStats;
  preferences: UserPreferences;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  streakCurrent: number;
  streakMax: number;
  totalXP: number;
  daysActive: number;
  averageCompletionTime: number;
  favoriteCategory: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    deadline: boolean;
    daily: boolean;
  };
  privacy: {
    profilePublic: boolean;
    statsPublic: boolean;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar: '' });

  // Session kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  // Profil verilerini getir
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  /**
   * ============ PROFİL VERİLERİNİ GETİRME FONKSİYONU ============
   * Bu fonksiyon backend API'den kullanıcının profil bilgilerini getirir
   * 
   * API Endpoint: GET /api/users/profile
   * Bu endpoint şu verileri döndürür:
   * - Temel bilgiler (isim, email, avatar)
   * - Gamification verileri (level, XP, achievements)
   * - İstatistikler (toplam görev, tamamlanan görev, streak)
   * - Kullanıcı tercihleri (tema, bildirimler)
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(''); // Önceki hataları temizle
      
      console.log('🔄 Profil verileri getiriliyor...');
      
      // Backend API'ye GET isteği gönder
      const response = await fetch('/api/users/profile');
      
      if (response.ok) {
        // Başarılı yanıt alındı
        const data = await response.json();
        console.log('✅ Profil verileri başarıyla getirildi:', data);
        
        // State'leri güncelle
        setProfile(data);
        setEditForm({ 
          name: data.name || '', 
          avatar: data.avatar || '' 
        });
      } else {
        // HTTP hata durumu
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Profil getirme hatası:', response.status, errorData);
        setError(errorData.error || 'Profil bilgileri yüklenemedi');
      }
    } catch (error) {
      // Network veya parse hatası
      console.error('❌ Profil fetch network hatası:', error);
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ============ PROFİL GÜNCELLEME FONKSİYONU ============
   * Bu fonksiyon kullanıcının profil bilgilerini günceller
   * 
   * API Endpoint: PUT /api/users/profile
   * Gönderilen veriler:
   * - name: Kullanıcının yeni ismi
   * - avatar: Profil resmi URL'si
   * 
   * Güvenlik: Backend'de sadece güvenli alanlar güncellenir
   */
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError(''); // Önceki hataları temizle
      
      // Form validation
      if (!editForm.name?.trim()) {
        setError('İsim alanı zorunludur');
        return;
      }
      
      console.log('🔄 Profil güncelleniyor...', editForm);
      
      // Backend API'ye PUT isteği gönder
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          // Potansiyel CSRF koruması için
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          avatar: editForm.avatar?.trim() || ''
        })
      });

      if (response.ok) {
        // Başarılı güncelleme
        const result = await response.json();
        console.log('✅ Profil başarıyla güncellendi:', result);
        
        // Güncel profil verilerini tekrar getir
        await fetchProfile();
        setEditing(false); // Edit modundan çık
        
        // Başarı mesajı göster (kısa süre)
        setError(''); // Hata varsa temizle
        setTimeout(() => {
          // 3 saniye sonra success mesajını gizle
        }, 3000);
        
      } else {
        // HTTP hata durumu
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Profil güncelleme hatası:', response.status, errorData);
        setError(errorData.error || 'Profil güncellenemedi');
      }
    } catch (error) {
      // Network veya parse hatası
      console.error('❌ Profil güncelleme network hatası:', error);
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (xp: number): { level: number; xpToNext: number } => {
    // Level hesaplama: Her level 100 XP artar (Level 1: 100, Level 2: 200, vs.)
    let level = 1;
    let totalXpForLevel = 100;
    
    while (xp >= totalXpForLevel) {
      level++;
      totalXpForLevel += level * 100;
    }
    
    const xpForCurrentLevel = (level - 1) * 100;
    const xpToNext = totalXpForLevel - xp;
    
    return { level: level - 1, xpToNext };
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
          👤 Profilim
        </h1>
        <p className="text-gray-600 text-lg">Profil bilgileriniz, başarılarınız ve istatistikleriniz</p>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
      ) : profile ? (
        <>
          {/* Profile Info & Level */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Profil Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {editing ? (
                      <div className="space-y-2">
                        <Label htmlFor="name">İsim</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                        <p className="text-gray-600">{profile.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {editing ? (
                    <>
                      <Button onClick={updateProfile} disabled={loading}>
                        💾 Kaydet
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        ❌ İptal
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)}>
                      ✏️ Düzenle
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Level & XP Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>⭐</span>
                  <span>Level & Deneyim</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Level {profile.level}
                  </div>
                  <div className="text-gray-600 mt-2">
                    {profile.xp} XP / {profile.xp + profile.xpToNext} XP
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sonraki level'e</span>
                    <span>{profile.xpToNext} XP</span>
                  </div>
                  <Progress 
                    value={(profile.xp / (profile.xp + profile.xpToNext)) * 100} 
                    className="h-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-purple-600">{profile.stats.totalXP}</div>
                    <div className="text-xs text-gray-600">Toplam XP</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-pink-600">{profile.stats.daysActive}</div>
                    <div className="text-xs text-gray-600">Aktif Gün</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{profile.stats.completedTasks}</div>
                <div className="text-sm text-blue-700 font-medium">Tamamlanan Görev</div>
                <div className="text-xs text-blue-600/70 mt-1">
                  {profile.stats.totalTasks} toplam görevden
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{profile.stats.streakCurrent}</div>
                <div className="text-sm text-green-700 font-medium">Mevcut Seri</div>
                <div className="text-xs text-green-600/70 mt-1">
                  En yüksek: {profile.stats.streakMax} gün
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600">
                  {profile.stats.averageCompletionTime.toFixed(1)}h
                </div>
                <div className="text-sm text-orange-700 font-medium">Ortalama Süre</div>
                <div className="text-xs text-orange-600/70 mt-1">
                  Görev tamamlama
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{profile.stats.favoriteCategory}</div>
                <div className="text-sm text-purple-700 font-medium">Favori Kategori</div>
                <div className="text-xs text-purple-600/70 mt-1">
                  En çok kullanılan
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Başarılar</span>
                <Badge variant="secondary">{profile.achievements.length}</Badge>
              </CardTitle>
              <CardDescription>Kazandığınız rozetler ve başarılar</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.achievements.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profile.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${getRarityColor(achievement.rarity)} hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              +{achievement.xpReward} XP
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🏆</div>
                  <p>Henüz başarı kazanmadınız. Görev tamamlayarak başarılar kazanın!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-blue-100 to-purple-100 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Hızlı Eylemler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => window.location.href = '/'}
                >
                  📋 Görevlere Dön
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/analytics'}
                >
                  📊 Analytics
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
                  onClick={fetchProfile}
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
              Profil bilgileri yüklenemedi. Lütfen tekrar deneyin.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 