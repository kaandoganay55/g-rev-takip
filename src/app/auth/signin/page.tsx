"use client";

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

// Giriş yapma sayfası
export default function SignIn() {
  // Router nesnesi - Sayfa yönlendirme için
  const router = useRouter();
  
  // Form verileri için state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email/şifre ile giriş yapma fonksiyonu
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); // Formun varsayılan gönderimini engelle
    
    // Boş alan kontrolü
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // NextAuth credentials provider ile giriş yap
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Otomatik yönlendirme yapma
      });

      // Giriş başarısızsa hata göster
      if (result?.error) {
        setError('Email veya şifre hatalı');
        return;
      }

      // Giriş başarılıysa ana sayfaya yönlendir
      router.push('/');
      router.refresh(); // Sayfayı yenile
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş yapma fonksiyonu
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      // Google OAuth ile giriş yap
      await signIn('google', {
        callbackUrl: '/', // Giriş sonrası ana sayfaya git
      });
    } catch (error) {
      console.error('Google giriş hatası:', error);
      setError('Google ile giriş yapılırken hata oluştu');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
          <CardDescription>
            Hesabınıza giriş yaparak görevlerinizi yönetin
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Hata mesajı */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Google ile giriş butonu */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Yükleniyor...' : '🌐 Google ile Giriş Yap'}
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

          {/* Email/şifre ile giriş formu */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
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
                placeholder="Şifrenizi girin"
                disabled={loading}
                required
              />
            </div>

            {/* Giriş butonu */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>

          {/* Kayıt olma linki */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Hesabınız yok mu? </span>
            <Link 
              href="/auth/signup" 
              className="text-primary hover:underline font-medium"
            >
              Kayıt Ol
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 