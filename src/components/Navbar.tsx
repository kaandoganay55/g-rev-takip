"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationCenter from '@/components/NotificationCenter';

// Navigasyon çubuğu bileşeni
export default function Navbar() {
  // Session bilgilerini al
  const { data: session, status } = useSession();

  // Çıkış yapma fonksiyonu
  const handleSignOut = () => {
    signOut({
      callbackUrl: '/auth/signin', // Çıkış sonrası giriş sayfasına git
    });
  };

  // Kullanıcı adının baş harflerini alma
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo ve ana başlık */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              <span className="text-2xl">🎯</span>
              <span className="hidden sm:inline">Görev Takip</span>
            </Link>
          </div>

          {/* Navigasyon menüsü */}
          <div className="flex items-center space-x-4">
            {/* Session yüklenirken */}
            {status === 'loading' && (
              <div className="text-sm text-gray-500 animate-pulse">Yükleniyor...</div>
            )}

            {/* Kullanıcı giriş yapmamışsa */}
            {status === 'unauthenticated' && (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Kayıt Ol
                  </Button>
                </Link>
              </div>
            )}

            {/* Kullanıcı giriş yapmışsa */}
            {status === 'authenticated' && session && (
              <div className="flex items-center space-x-4">
                {/* Görevler linki */}
                <Link href="/">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    📋 Görevlerim
                  </Button>
                </Link>

                {/* Araçlar linki */}
                <Link href="/tools">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    🛠️ Araçlar
                  </Button>
                </Link>

                {/* Analytics linki */}
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="hidden lg:flex">
                    📊 Analytics
                  </Button>
                </Link>

                {/* Bildirim Merkezi */}
                <NotificationCenter />

                {/* Profil Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={session.user?.image || ''} 
                          alt={session.user?.name || session.user?.email || 'Kullanıcı'} 
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                          {session.user?.name 
                            ? getUserInitials(session.user.name)
                            : session.user?.email?.charAt(0).toUpperCase() || 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name || 'Kullanıcı'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/" className="cursor-pointer">
                        📋 Görevlerim
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/tools" className="cursor-pointer">
                        🛠️ Araçlar
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/analytics" className="cursor-pointer">
                        📊 Analytics
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        👤 Profil
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        ⚙️ Ayarlar
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      🚪 Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 