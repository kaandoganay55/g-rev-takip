"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple inline components
const Label = ({ children, htmlFor, className = "" }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
    {children}
  </label>
);

const Switch = ({ 
  id, 
  checked = false, 
  onCheckedChange, 
  disabled = false 
}: { 
  id?: string; 
  checked?: boolean; 
  onCheckedChange?: (checked: boolean) => void; 
  disabled?: boolean; 
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    onClick={() => onCheckedChange?.(!checked)}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      deadline: true,
    },
    appearance: {
      theme: 'light',
      language: 'tr',
    },
    ai: {
      enabled: true,
      suggestions: true,
    },
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
  }, [session, status]);

  useEffect(() => {
    if (session) {
      setTimeout(() => setLoading(false), 1000);
    }
  }, [session]);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    
    setTimeout(() => {
      setSuccess('Ayarlar başarıyla kaydedildi!');
      setSaving(false);
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const updateNotificationSetting = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
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
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
          ⚙️ Ayarlar
        </h1>
        <p className="text-gray-600 text-lg">Uygulama tercihlerinizi ve ayarlarınızı yönetin</p>
      </div>

      {/* Status Messages */}
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

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-700">
              <span>✅</span>
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Bildirim Ayarları */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🔔</span>
                <span>Bildirimler</span>
              </CardTitle>
              <CardDescription>Hangi bildirimleri almak istediğinizi seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">E-posta Bildirimleri</Label>
                    <p className="text-sm text-gray-600">Önemli güncellemeler için e-posta alın</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked: boolean) => updateNotificationSetting('email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Tarayıcı Bildirimleri</Label>
                    <p className="text-sm text-gray-600">Anlık push bildirimleri</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked: boolean) => updateNotificationSetting('push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deadline-notifications">Son Tarih Uyarıları</Label>
                    <p className="text-sm text-gray-600">Görev son tarihleri yaklaştığında uyar</p>
                  </div>
                  <Switch
                    id="deadline-notifications"
                    checked={settings.notifications.deadline}
                    onCheckedChange={(checked: boolean) => updateNotificationSetting('deadline', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Görünüm Ayarları */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🎨</span>
                <span>Görünüm</span>
              </CardTitle>
              <CardDescription>Uygulamanın görünümünü özelleştirin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select 
                    value={settings.appearance.theme} 
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, theme: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tema seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">🌞 Açık</SelectItem>
                      <SelectItem value="dark">🌙 Koyu</SelectItem>
                      <SelectItem value="auto">🔄 Otomatik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <Select 
                    value={settings.appearance.language} 
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, language: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Ayarları */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🤖</span>
                <span>Yapay Zeka</span>
              </CardTitle>
              <CardDescription>AI özelliklerini yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-enabled">AI Özellikleri</Label>
                    <p className="text-sm text-gray-600">Tüm AI özelliklerini etkinleştir</p>
                  </div>
                  <Switch
                    id="ai-enabled"
                    checked={settings.ai.enabled}
                    onCheckedChange={(checked: boolean) => setSettings(prev => ({
                      ...prev,
                      ai: { ...prev.ai, enabled: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-suggestions">Görev Önerileri</Label>
                    <p className="text-sm text-gray-600">AI destekli görev önerileri</p>
                  </div>
                  <Switch
                    id="ai-suggestions"
                    checked={settings.ai.suggestions}
                    onCheckedChange={(checked: boolean) => setSettings(prev => ({
                      ...prev,
                      ai: { ...prev.ai, suggestions: checked }
                    }))}
                    disabled={!settings.ai.enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaydet Butonu */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
              size="lg"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  💾 Ayarları Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 