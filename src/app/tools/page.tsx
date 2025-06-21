"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ToolsPage() {
  const { data: session, status } = useSession();

  // Pomodoro Timer state'leri
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workTime: 25,
    breakTime: 5,
    longBreakTime: 15,
  });
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 dakika
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);

  // Tarih ayarları
  const [timeZone, setTimeZone] = useState('Europe/Istanbul');
  const [workDays, setWorkDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [workHours, setWorkHours] = useState({ start: '09:00', end: '17:00' });

  // İstatistikler için state
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    todayTasks: 0,
    weeklyProgress: 0
  });

  // Session kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  // Pomodoro ayarlarını yükle
  useEffect(() => {
    if (session) {
      const savedPomodoroSettings = localStorage.getItem(`pomodoroSettings_${session.user?.email}`);
      if (savedPomodoroSettings) {
        const settings = JSON.parse(savedPomodoroSettings);
        setPomodoroSettings(settings);
        setPomodoroTime(settings.workTime * 60);
      }

      // Tarayıcı bildirimi izni iste
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [session]);

  // Pomodoro Timer useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(time => time - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsTimerRunning(false);
      if (timerMode === 'work') {
        setPomodoroCount(count => count + 1);
        setTimerMode('break');
        setPomodoroTime(pomodoroSettings.breakTime * 60);
        // Tarayıcı bildirimi
        if (Notification.permission === 'granted') {
          new Notification('🍅 Pomodoro Tamamlandı!', {
            body: 'Harika iş! Mola zamanı.',
            icon: '/tomato-icon.png'
          });
        }
      } else {
        setTimerMode('work');
        setPomodoroTime(pomodoroSettings.workTime * 60);
        if (Notification.permission === 'granted') {
          new Notification('💪 Mola Bitti!', {
            body: 'Yeni bir pomodoro başlıyor!',
            icon: '/work-icon.png'
          });
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, pomodoroTime, timerMode, pomodoroSettings]);

  // İstatistikleri yükle
  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  // İstatistikleri getir
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasks = await response.json();
        const today = new Date().toDateString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const todayTasks = tasks.filter((task: any) => 
          new Date(task.createdAt).toDateString() === today
        );
        
        const weekTasks = tasks.filter((task: any) => 
          new Date(task.createdAt) >= weekAgo
        );
        
        const weekCompleted = weekTasks.filter((task: any) => task.completed);
        
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task: any) => task.completed).length,
          todayTasks: todayTasks.length,
          weeklyProgress: weekTasks.length > 0 ? Math.round((weekCompleted.length / weekTasks.length) * 100) : 0
        });
      }
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  // Pomodoro timer fonksiyonları
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (timerMode === 'work') {
      setPomodoroTime(pomodoroSettings.workTime * 60);
    } else {
      setPomodoroTime(pomodoroSettings.breakTime * 60);
    }
  };

  const savePomodoroSettings = () => {
    if (session?.user?.email) {
      localStorage.setItem(`pomodoroSettings_${session.user.email}`, JSON.stringify(pomodoroSettings));
    }
    setShowPomodoroSettings(false);
    resetTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Session yüklenirken
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

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 relative">
      {/* Modern Arka Plan Efekti */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Başlık */}
      <div className="text-center space-y-4 animate-in slide-in-from-top duration-1000">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent animate-gradient-x">
          <span className="animate-float inline-block">🛠️</span> Verimlilik Araçları
        </h1>
        <p className="text-gray-600 text-xl font-medium">Pomodoro Timer, İstatistikler, Zaman Yönetimi ve Daha Fazlası</p>
        
        {/* Quick Stats */}
        <div className="flex justify-center space-x-6 mt-6">
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="text-lg font-bold text-red-600">{pomodoroCount}</div>
            <div className="text-xs text-gray-600">Pomodoro</div>
          </div>
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="text-lg font-bold text-blue-600">{stats.totalTasks}</div>
            <div className="text-xs text-gray-600">Görev</div>
          </div>
          <div className="text-center p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg">
            <div className="text-lg font-bold text-green-600">{stats.weeklyProgress}%</div>
            <div className="text-xs text-gray-600">Haftalık</div>
          </div>
        </div>
      </div>

      {/* Ana İçerik Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Pomodoro Timer */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center space-x-2">
              <span className="text-3xl">🍅</span>
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent text-2xl">
                Pomodoro Timer
              </span>
            </CardTitle>
            <CardDescription className="text-lg">
              {timerMode === 'work' ? '💪 Çalışma Zamanı' : '☕ Mola Zamanı'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className={`text-6xl lg:text-8xl font-bold ${
              timerMode === 'work' 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
            }`}>
              {formatTime(pomodoroTime)}
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={`${
                  isTimerRunning 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                {isTimerRunning ? '⏸️ Durdur' : '▶️ Başlat'}
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
              >
                🔄 Sıfırla
              </Button>
              <Button
                onClick={() => setShowPomodoroSettings(true)}
                variant="outline"
                size="lg"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
              >
                ⚙️ Ayarlar
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-white/50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{pomodoroCount}</div>
                <div className="text-sm text-gray-600">Tamamlanan Pomodoro</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor(pomodoroCount * pomodoroSettings.workTime / 60)}h
                </div>
                <div className="text-sm text-gray-600">Toplam Çalışma</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İstatistikler */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">📊</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl">
                İstatistikler
              </span>
            </CardTitle>
            <CardDescription>Verimlilik metrikleriniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/60 rounded-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {stats.totalTasks}
                </div>
                <div className="text-sm text-blue-700 font-medium">Toplam Görev</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {stats.completedTasks}
                </div>
                <div className="text-sm text-green-700 font-medium">Tamamlanan</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {stats.todayTasks}
                </div>
                <div className="text-sm text-orange-700 font-medium">Bugünkü Görevler</div>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-xl">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {stats.weeklyProgress}%
                </div>
                <div className="text-sm text-purple-700 font-medium">Haftalık İlerleme</div>
              </div>
            </div>
            
            <Button 
              onClick={fetchStats}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              📈 İstatistikleri Yenile
            </Button>
          </CardContent>
        </Card>

        {/* Zaman Ayarları */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">⏰</span>
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent text-2xl">
                Zaman Ayarları
              </span>
            </CardTitle>
            <CardDescription>Çalışma saatlerinizi özelleştirin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Zaman Dilimi</label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Istanbul">🇹🇷 İstanbul (GMT+3)</SelectItem>
                  <SelectItem value="Europe/London">🇬🇧 Londra (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">🇺🇸 New York (GMT-5)</SelectItem>
                  <SelectItem value="Asia/Tokyo">🇯🇵 Tokyo (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Başlangıç Saati</label>
                <Input
                  type="time"
                  value={workHours.start}
                  onChange={(e) => setWorkHours({...workHours, start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bitiş Saati</label>
                <Input
                  type="time"
                  value={workHours.end}
                  onChange={(e) => setWorkHours({...workHours, end: e.target.value})}
                />
              </div>
            </div>
            
            <div className="text-center p-4 bg-white/60 rounded-xl">
              <div className="text-lg font-semibold text-green-700">
                Günlük Çalışma Süresi
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const start = new Date(`2000-01-01T${workHours.start}`);
                  const end = new Date(`2000-01-01T${workHours.end}`);
                  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return Math.max(0, diff).toFixed(1);
                })()}h
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hızlı Eylemler */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-2xl">
                Hızlı Eylemler
              </span>
            </CardTitle>
            <CardDescription>Sık kullanılan işlemler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => window.location.href = '/'}
              >
                📋 Görevlere Git
              </Button>
              
              <Button 
                variant="outline"
                className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => {
                  if (Notification.permission !== 'granted') {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        new Notification('✅ Bildirimler Aktifleştirildi!', {
                          body: 'Artık Pomodoro bildirimleri alacaksınız.'
                        });
                      }
                    });
                  } else {
                    new Notification('🔔 Test Bildirimi', {
                      body: 'Bildirimler çalışıyor!'
                    });
                  }
                }}
              >
                🔔 Bildirimleri Test Et
              </Button>
              
              <Button 
                variant="outline"
                className="w-full justify-start border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => {
                  const data = {
                    pomodoroSettings,
                    workHours,
                    timeZone,
                    stats
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'verimlilik-ayarlari.json';
                  a.click();
                }}
              >
                💾 Ayarları Dışa Aktar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro Ayarları Modal */}
      <Dialog open={showPomodoroSettings} onOpenChange={setShowPomodoroSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">⚙️ Pomodoro Ayarları</DialogTitle>
            <DialogDescription className="text-center">
              Çalışma ve mola sürelerinizi özelleştirin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* Çalışma Süresi */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">🔥 Çalışma Süresi (dakika)</label>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, workTime: Math.max(5, pomodoroSettings.workTime - 5)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-red-600">{pomodoroSettings.workTime}</div>
                  <div className="text-xs text-gray-500">dakika</div>
                </div>
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, workTime: Math.min(60, pomodoroSettings.workTime + 5)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  +
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 25, 30, 45].map((time) => (
                  <Button
                    key={time}
                    variant={pomodoroSettings.workTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPomodoroSettings({...pomodoroSettings, workTime: time})}
                    className={pomodoroSettings.workTime === time ? "bg-red-500" : ""}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Kısa Mola */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">☕ Kısa Mola (dakika)</label>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, breakTime: Math.max(3, pomodoroSettings.breakTime - 1)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-green-600">{pomodoroSettings.breakTime}</div>
                  <div className="text-xs text-gray-500">dakika</div>
                </div>
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, breakTime: Math.min(15, pomodoroSettings.breakTime + 1)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  +
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 15].map((time) => (
                  <Button
                    key={time}
                    variant={pomodoroSettings.breakTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPomodoroSettings({...pomodoroSettings, breakTime: time})}
                    className={pomodoroSettings.breakTime === time ? "bg-green-500" : ""}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* Uzun Mola */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">🛋️ Uzun Mola (dakika)</label>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, longBreakTime: Math.max(10, pomodoroSettings.longBreakTime - 5)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-blue-600">{pomodoroSettings.longBreakTime}</div>
                  <div className="text-xs text-gray-500">dakika</div>
                </div>
                <Button
                  onClick={() => setPomodoroSettings({...pomodoroSettings, longBreakTime: Math.min(30, pomodoroSettings.longBreakTime + 5)})}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 rounded-full"
                >
                  +
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[15, 20, 30].map((time) => (
                  <Button
                    key={time}
                    variant={pomodoroSettings.longBreakTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPomodoroSettings({...pomodoroSettings, longBreakTime: time})}
                    className={pomodoroSettings.longBreakTime === time ? "bg-blue-500" : ""}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                💡 Geleneksel Pomodoro: 25 dakika çalışma, 5 dakika mola
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPomodoroSettings(false)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={savePomodoroSettings}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Ayarları Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 