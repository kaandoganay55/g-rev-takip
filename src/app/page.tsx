"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNotifications } from '@/hooks/useNotifications';
import TodayTasks from '@/components/TodayTasks';
import CalendarView from '@/components/CalendarView';

// Görev nesnesinin tipini tanımla
interface Task {
  _id: string;
  title: string;
  description: string;
  userId: string; // Kullanıcıya ait görevler için
  priority?: string; // AI tarafından belirlenen öncelik
  category?: string; // AI tarafından önerilen kategori
  completed?: boolean; // Görev tamamlanma durumu
  completedAt?: Date; // Tamamlanma tarihi
  createdAt?: Date; // Oluşturulma tarihi
  deadline?: Date; // Son tarih
}

// Dinamik soru tiplerini tanımla
interface DynamicQuestion {
  id: string;
  question: string;
  type: 'select' | 'input' | 'number';
  options?: string[];
  placeholder?: string;
}

export default function TaskManager() {
  // Session bilgilerini al
  const { data: session, status } = useSession();
  
  // Görevler listesi için state
  const [tasks, setTasks] = useState<Task[]>([]);
  // Yeni görev için state
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'orta', category: '', deadline: '' });
  // Yükleme durumu için state
  const [loading, setLoading] = useState(false);
  // Hata durumu için state
  const [error, setError] = useState<string>('');
  
  // AI özellikleri için state'ler
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [suggestionInput, setSuggestionInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dinamik sorular için state'ler
  const [currentStep, setCurrentStep] = useState(0);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showQuestionFlow, setShowQuestionFlow] = useState(false);

  // Bildirim hook'u
  const { createTestNotification } = useNotifications();

  // Tab sistemi için state
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'today'>('tasks');
  
  // Başarı mesajı için state
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Session kontrolü
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  // Bileşen yüklendiğinde görevleri getir
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  // Dinamik sorular oluştur
  const generateDynamicQuestions = (taskCount: number): DynamicQuestion[] => {
    const questions: DynamicQuestion[] = [
      {
        id: 'category',
        question: 'Görevleriniz hangi kategoride?',
        type: 'select',
        options: ['İş', 'Kişisel', 'Eğitim', 'Sağlık', 'Ev İşleri', 'Proje', 'Alışveriş', 'Sosyal']
      },
      {
        id: 'priority',
        question: 'Bu görevlerin öncelik seviyesi nedir?',
        type: 'select',
        options: ['düşük', 'orta', 'yüksek', 'acil']
      }
    ];

    if (taskCount > 3) {
      questions.push({
        id: 'deadline',
        question: 'Bu görevler için kaç gün süre ayırmayı planlıyorsunuz?',
        type: 'select',
        options: ['1 gün', '3 gün', '1 hafta', '2 hafta', '1 ay', 'Süresiz']
      });
    }

    if (taskCount > 5) {
      questions.push({
        id: 'timePerTask',
        question: 'Her görev için ortalama ne kadar zaman ayırabilirsiniz?',
        type: 'select',
        options: ['15 dakika', '30 dakika', '1 saat', '2 saat', 'Yarım gün', 'Tam gün']
      });
    }

    return questions;
  };

  // Kaç görev eklemek istediğini soran fonksiyon
  const startTaskCreation = () => {
    const taskCount = prompt('Kaç görev eklemek istiyorsunuz? (1-10 arası)');
    const count = parseInt(taskCount || '0');
    
    if (count > 0 && count <= 10) {
      const questions = generateDynamicQuestions(count);
      setDynamicQuestions(questions);
      setCurrentStep(0);
      setAnswers({ taskCount: count.toString() });
      setShowQuestionFlow(true);
    } else {
      setError('Lütfen 1-10 arası geçerli bir sayı girin');
    }
  };

  // Dinamik soru cevaplama
  const handleAnswerQuestion = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Sonraki soruya geç
  const nextQuestion = () => {
    if (currentStep < dynamicQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tüm sorular cevaplandı, görevleri oluştur
      generateTasksFromAnswers();
    }
  };

  // Cevaplara göre görevler oluştur
  const generateTasksFromAnswers = async () => {
    const taskCount = parseInt(answers.taskCount || '1');
    const category = answers.category || 'Genel';
    const priority = answers.priority || 'orta';
    
    try {
      setAiLoading(true);
      setError('');

      // AI'dan kategori bazlı görev önerileri al
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userInput: `${category} kategorisinde ${taskCount} adet ${priority} öncelikli görev`,
          count: taskCount
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions.slice(0, taskCount));
        setShowSuggestions(true);
        setNewTask(prev => ({ ...prev, category, priority, deadline: '' }));
        
        // Görevler sekmesine geç ve aşağı scroll yap
        setActiveTab('tasks');
        setSuccessMessage(`🎉 ${taskCount} görev için AI önerileri oluşturuldu! Aşağıdan görevlerinizi seçebilirsiniz.`);
        setTimeout(() => {
          const tasksSection = document.getElementById('tasks-section');
          if (tasksSection) {
            tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        // Başarı mesajını 5 saniye sonra gizle
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Görev önerileri hatası:', error);
      setError('Görev önerileri oluşturulurken hata oluştu');
    } finally {
      setAiLoading(false);
      setShowQuestionFlow(false);
    }
  };

  // Sunucudan görevleri getiren fonksiyon
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error('Görevler getirilemedi');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Görevler getirilirken hata:', error);
      setError('Görevler yüklenemedi. Lütfen tekrar deneyin.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Form input değişikliklerini yöneten fonksiyon
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  // AI görev önerileri alma fonksiyonu
  const getAISuggestions = async () => {
    if (!suggestionInput.trim()) {
      setError('Lütfen bir konu girin');
      return;
    }

    try {
      setAiLoading(true);
      setError('');

      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: suggestionInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI önerileri alınamadı');
      }

      const data = await response.json();
      setAiSuggestions(data.suggestions);
      setShowSuggestions(true);
    } catch (error: any) {
      console.error('AI önerileri hatası:', error);
      setError(error.message || 'AI önerileri alınırken hata oluştu');
    } finally {
      setAiLoading(false);
    }
  };

  // AI açıklaması oluşturma fonksiyonu
  const generateAIDescription = async () => {
    if (!newTask.title.trim()) {
      setError('Önce bir görev başlığı girin');
      return;
    }

    try {
      setAiLoading(true);
      setError('');

      const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTask.title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI açıklaması oluşturulamadı');
      }

      const data = await response.json();
      setNewTask({ ...newTask, description: data.description });
    } catch (error: any) {
      console.error('AI açıklama hatası:', error);
      setError(error.message || 'AI açıklaması oluşturulurken hata oluştu');
    } finally {
      setAiLoading(false);
    }
  };

  // Önerilen görevi direkt görev olarak kaydeden fonksiyon
  const useSuggestion = async (suggestion: string) => {
    try {
      setLoading(true);
      setError('');
      
      // AI ile açıklama oluştur
      let description = '';
      try {
        const descResponse = await fetch('/api/ai/description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: suggestion }),
        });
        if (descResponse.ok) {
          const descData = await descResponse.json();
          description = descData.description;
        }
      } catch (descError) {
        console.log('AI açıklama oluşturulamadı, boş bırakılıyor');
        description = `${suggestion} görevi için detaylar`;
      }

      const taskData = {
        title: suggestion,
        description: description,
        priority: 'orta',
        category: newTask.category || '',
        userId: session?.user?.email,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Görev eklenemedi');
      }

      const newTaskData = await response.json();
      setTasks([...tasks, newTaskData]);
      
      // AI önerilerinden kaldır
      setAiSuggestions(prev => prev.filter(s => s !== suggestion));
      
      // Eğer hiç öneri kalmadıysa önerileri gizle
      if (aiSuggestions.length <= 1) {
        setShowSuggestions(false);
        setSuggestionInput('');
        setAiSuggestions([]);
      }
      
      setError('');
    } catch (error) {
      console.error('Görev ekleme hatası:', error);
      setError('Görev eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Yeni görev ekleme fonksiyonu
  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const taskData = {
        ...newTask,
        userId: session?.user?.email,
        deadline: newTask.deadline ? new Date(newTask.deadline) : undefined
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Görev eklenemedi');
      }

      const newTaskData = await response.json();
      setTasks([...tasks, newTaskData]);
      setNewTask({ title: '', description: '', priority: 'orta', category: '', deadline: '' });
      setError('');
    } catch (error) {
      console.error('Görev ekleme hatası:', error);
      setError('Görev eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Görev tamamlama fonksiyonu
  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/tasks/complete', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          completed: !currentStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Görev durumu güncellenemedi');
      }

      // Görevi yerel state'te güncelle
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, completed: !currentStatus, completedAt: !currentStatus ? new Date() : undefined }
            : task
        )
      );
      setError('');
    } catch (error) {
      console.error('Görev tamamlama hatası:', error);
      setError('Görev durumu güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Görev silme fonksiyonu
  const deleteTask = async (id: string) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Görev silinemedi');
      }

      setTasks(tasks.filter(task => task._id !== id));
      setError('');
    } catch (error) {
      console.error('Görev silme hatası:', error);
      setError('Görev silinemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
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

  // Session yoksa gösterme (redirect zaten çalışacak)
  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 relative">
      {/* Modern Arka Plan Efekti */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      {/* Hoş Geldin Başlığı */}
      <div className="text-center space-y-2 animate-in slide-in-from-top duration-1000">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
          <span className="animate-float inline-block">🎯</span> Hoş Geldiniz, {session.user?.name || session.user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600 text-xl font-medium">Görevlerinizi düzenleyin ve AI yardımıyla daha verimli olun</p>
        <div className="flex justify-center space-x-2 mt-4">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200"></span>
          <span className="inline-block w-2 h-2 bg-pink-500 rounded-full animate-bounce animation-delay-400"></span>
        </div>
      </div>

      {/* Hata mesajı gösterimi */}
      {error && (
        <Card className="border-red-200 bg-red-50 animate-in slide-in-from-top duration-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Başarı mesajı gösterimi */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50 animate-in slide-in-from-top duration-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Modern Tab Navigasyonu */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-1 shadow-lg">
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'tasks' 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gray-100/80 hover:scale-102'
            }`}
          >
            📋 Görevler
          </Button>
          <Button
            variant={activeTab === 'today' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('today')}
            className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'today' 
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gray-100/80 hover:scale-102'
            }`}
          >
            📅 Bugün
          </Button>
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'calendar' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gray-100/80 hover:scale-102'
            }`}
          >
            🗓️ Takvim
          </Button>
        </div>
      </div>

      {/* Ana Eylemler - Sadece Görevler tabında göster */}
      {activeTab === 'tasks' && (
        <div className="grid md:grid-cols-2 gap-6">
        {/* Hızlı Görev Ekleme */}
        <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Hızlı Görev Ekle</span>
            </CardTitle>
            <CardDescription>
              Tek tek görev ekleyin veya AI yardımı alın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              name="title"
              placeholder="Görev başlığı..."
              value={newTask.title}
              onChange={handleInputChange}
              disabled={loading || aiLoading}
            />
            
            <div className="flex space-x-2">
              <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Öncelik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="düşük">🟢 Düşük</SelectItem>
                  <SelectItem value="orta">🟡 Orta</SelectItem>
                  <SelectItem value="yüksek">🟠 Yüksek</SelectItem>
                  <SelectItem value="acil">🔴 Acil</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                name="category"
                placeholder="Kategori (opsiyonel)"
                value={newTask.category}
                onChange={handleInputChange}
                disabled={loading || aiLoading}
                className="flex-1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Son Tarih (Opsiyonel)</label>
              <Input
                type="date"
                name="deadline"
                value={newTask.deadline}
                onChange={handleInputChange}
                disabled={loading || aiLoading}
                className="w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex space-x-2">
              <Textarea
                name="description"
                placeholder="Görev açıklaması..."
                value={newTask.description}
                onChange={handleInputChange}
                disabled={loading || aiLoading}
                className="flex-1"
                rows={3}
              />
              <Button
                variant="outline"
                onClick={generateAIDescription}
                disabled={!newTask.title.trim() || aiLoading}
                className="px-3"
                title="AI ile açıklama oluştur"
              >
                {aiLoading ? '🔄' : '🤖'}
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                onClick={addTask}
                disabled={loading || !newTask.title.trim() || !newTask.description.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {loading ? '🔄 Ekleniyor...' : '✨ Görev Ekle'}
              </Button>
              
              <Button
                onClick={createTestNotification}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 hover:scale-105"
                type="button"
              >
                🔔 Test Bildirimi Gönder
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Akıllı Görev Oluşturucu */}
        <Card className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center space-x-2">
              <span>🚀</span>
              <span>Akıllı Görev Oluşturucu</span>
            </CardTitle>
            <CardDescription>
              Birden fazla görev oluşturun, size özel sorular cevaplayın
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Button
              onClick={startTaskCreation}
              disabled={loading || aiLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              size="lg"
            >
              🎯 Görev Oluşturmaya Başla
            </Button>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>✨ Size özel sorular soracağız</p>
              <p>📋 İhtiyacınıza göre görevler oluşturacağız</p>
              <p>🤖 AI yardımıyla optimize edeceğiz</p>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Bugünün Görevleri Sekmesi */}
      {activeTab === 'today' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodayTasks 
              tasks={tasks} 
              onToggleComplete={toggleTaskCompletion} 
            />
          </div>
          <div>
            {/* Mini İstatistikler */}
            <div className="grid gap-4">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                  <div className="text-sm text-gray-600">Toplam Görev</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.completed).length}</div>
                  <div className="text-sm text-gray-600">Tamamlanan</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Takvim Sekmesi */}
      {activeTab === 'calendar' && (
        <CalendarView 
          tasks={tasks} 
          onToggleComplete={toggleTaskCompletion} 
        />
      )}

      {/* Görevler sekmesi içeriği */}
      {activeTab === 'tasks' && (
        <>
                    {/* AI Görev Önerileri Bölümü */}
        <Card id="tasks-section" className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Görev Asistanı</span>
          </CardTitle>
          <CardDescription>
            Herhangi bir konuda görev önerileri alın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Hangi konuda görev önerileri istiyorsunuz? (örn: 'ev temizliği', 'proje yönetimi')"
              value={suggestionInput}
              onChange={(e) => setSuggestionInput(e.target.value)}
              className="flex-1"
              disabled={aiLoading}
            />
            <Button 
              onClick={getAISuggestions}
              disabled={aiLoading || !suggestionInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {aiLoading ? '🔄 Üretiliyor...' : '✨ Öneriler Al'}
            </Button>
          </div>

          {/* AI Önerilerini Göster */}
          {showSuggestions && aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-purple-800">💡 AI Önerileri:</h3>
              <div className="grid gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                  >
                    <span className="text-sm flex-1">{suggestion}</span>
                                            <Button
                          size="sm"
                          variant="outline"
                          onClick={() => useSuggestion(suggestion)}
                          className="ml-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                          disabled={loading}
                        >
                          {loading ? '➕' : '📋 Göreve Ekle'}
                        </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(false)}
                className="text-purple-600"
              >
                Önerileri Gizle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {tasks.length}
            </div>
            <div className="text-sm text-blue-700 font-medium">📋 Toplam Görev</div>
          </CardContent>
        </Card>
        <Card className="text-center hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              {tasks.filter(t => t.completed).length}
            </div>
            <div className="text-sm text-green-700 font-medium">✅ Tamamlanan</div>
          </CardContent>
        </Card>
        <Card className="text-center hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              {tasks.filter(t => !t.completed).length}
            </div>
            <div className="text-sm text-orange-700 font-medium">⏳ Bekleyen</div>
          </CardContent>
        </Card>
        <Card className="text-center hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
            </div>
            <div className="text-sm text-purple-700 font-medium">📊 Tamamlama</div>
          </CardContent>
        </Card>
      </div>

      {/* Görevler Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📋</span>
              <span>Görevleriniz ({tasks.length})</span>
            </span>
            {loading && <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">Henüz görev yok</h3>
              <p>İlk görevinizi ekleyerek başlayın!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task, index) => (
                <Card 
                  key={task._id} 
                  className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 shadow-lg animate-in slide-in-from-bottom-4 ${
                    task.completed 
                      ? 'opacity-75 bg-gradient-to-br from-gray-50 to-gray-100' 
                      : 'bg-gradient-to-br from-white to-blue-50/20'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => toggleTaskCompletion(task._id, task.completed || false)}
                          disabled={loading}
                          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                            task.completed 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg' 
                              : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                        >
                          {task.completed && '✓'}
                        </button>
                        <CardTitle className={`text-lg leading-tight flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task._id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-md"
                        disabled={loading}
                      >
                        🗑️
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className={`text-sm line-clamp-3 ${task.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {task.completed && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          ✅ Tamamlandı
                        </Badge>
                      )}
                      
                      {task.priority && (
                        <Badge 
                          variant={
                            task.priority === 'acil' ? 'destructive' :
                            task.priority === 'yüksek' ? 'default' :
                            task.priority === 'orta' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {task.priority === 'düşük' && '🟢'} 
                          {task.priority === 'orta' && '🟡'} 
                          {task.priority === 'yüksek' && '🟠'} 
                          {task.priority === 'acil' && '🔴'} 
                          {task.priority}
                        </Badge>
                      )}
                      
                      {task.category && (
                        <Badge variant="outline" className="text-xs">
                          📁 {task.category}
                        </Badge>
                      )}
                      
                      {task.deadline && (
                        <Badge variant="outline" className="text-xs">
                          📅 {new Date(task.deadline).toLocaleDateString('tr-TR')}
                        </Badge>
                      )}
                    </div>

                    {task.completedAt && (
                      <div className="text-xs text-gray-500">
                        🕐 {new Date(task.completedAt).toLocaleDateString('tr-TR')} tarihinde tamamlandı
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dinamik Soru Akışı Modal */}
      <Dialog open={showQuestionFlow} onOpenChange={setShowQuestionFlow}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Görev Oluşturucu - Adım {currentStep + 1}/{dynamicQuestions.length}</DialogTitle>
            <DialogDescription>
              Size uygun görevler oluşturmak için birkaç soru soracağız
            </DialogDescription>
          </DialogHeader>
          
          {dynamicQuestions[currentStep] && (
            <div className="space-y-4 py-4">
              <h3 className="font-medium text-lg">
                {dynamicQuestions[currentStep].question}
              </h3>
              
              {dynamicQuestions[currentStep].type === 'select' && (
                <Select 
                  value={answers[dynamicQuestions[currentStep].id] || ''} 
                  onValueChange={(value) => handleAnswerQuestion(dynamicQuestions[currentStep].id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicQuestions[currentStep].options?.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {dynamicQuestions[currentStep].type === 'input' && (
                <Input
                  placeholder={dynamicQuestions[currentStep].placeholder}
                  value={answers[dynamicQuestions[currentStep].id] || ''}
                  onChange={(e) => handleAnswerQuestion(dynamicQuestions[currentStep].id, e.target.value)}
                />
              )}
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowQuestionFlow(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={nextQuestion}
                  disabled={!answers[dynamicQuestions[currentStep].id]}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {currentStep === dynamicQuestions.length - 1 ? 'Görevleri Oluştur' : 'Sonraki'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
