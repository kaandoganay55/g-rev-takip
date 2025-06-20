"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

// Kayıt olma sayfası
export default function SignUp() {
  // Router nesnesi - Sayfa yönlendirme için
  const router = useRouter();
  
  // Form verileri için state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Kayıt olma fonksiyonu
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // Formun varsayılan gönderimini engelle
    
    // Boş alan kontrolü
    if (!name || !email || !password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    // Şifre uzunluk kontrolü
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Kullanıcı kayıt API'sine istek gönder
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      // Kayıt başarısızsa hata göster
      if (!response.ok) {
        setError(data.error || 'Kayıt olurken hata oluştu');
        return;
      }

      // Kayıt başarılıysa otomatik giriş yap
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Giriş başarısızsa signin sayfasına yönlendir
        router.push('/auth/signin?message=Kayıt başarılı, lütfen giriş yapın');
      } else {
        // Giriş başarılıysa ana sayfaya yönlendir
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      setError('Kayıt olurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Google ile kayıt olma fonksiyonu
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      // Google OAuth ile kayıt ol (giriş yap ile aynı)
      await signIn('google', {
        callbackUrl: '/', // Kayıt sonrası ana sayfaya git
      });
    } catch (error) {
      console.error('Google kayıt hatası:', error);
      setError('Google ile kayıt olurken hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Kayıt Ol</CardTitle>
          <CardDescription>
            Yeni hesap oluşturarak görev yönetimine başlayın
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Hata mesajı */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Google ile kayıt butonu */}
          <Button
            onClick={handleGoogleSignUp}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Yükleniyor...' : '🌐 Google ile Kayıt Ol'}
          </Button>

          {/* Ayırıcı çizgi */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                veya
              </span>
            </div>
          </div>

          {/* Kayıt formu */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* İsim alanı */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Ad Soyad
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız ve soyadınız"
                disabled={loading}
                required
              />
            </div>

            {/* Email alanı */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={loading}
                required
              />
            </div>

            {/* Şifre alanı */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Şifre
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                disabled={loading}
                required
              />
            </div>

            {/* Şifre tekrarı alanı */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Şifre Tekrarı
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                disabled={loading}
                required
              />
            </div>

            {/* Kayıt butonu */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          {/* Giriş yapma linki */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
            <Link 
              href="/auth/signin" 
              className="text-primary hover:underline font-medium"
            >
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 