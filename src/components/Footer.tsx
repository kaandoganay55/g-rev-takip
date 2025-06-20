import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-lg font-bold text-gray-800">Görev Takip</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              AI destekli görev yönetim sistemi ile daha verimli ve organize bir yaşam sürün. 
              Görevlerinizi akıllıca yönetin, zamandan tasarruf edin.
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Hızlı Erişim</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                📋 Görevlerim
              </Link>
              <div className="text-sm text-gray-400 cursor-not-allowed">
                📊 İstatistikler
              </div>
              <div className="text-sm text-gray-400 cursor-not-allowed">
                ⚙️ Ayarlar
              </div>
            </div>
          </div>

          {/* Yasal Linkler */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Yasal</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-400 cursor-not-allowed">
                🔒 Gizlilik Politikası
              </div>
              <div className="text-sm text-gray-400 cursor-not-allowed">
                📄 Kullanım Şartları
              </div>
              <div className="text-sm text-gray-400 cursor-not-allowed">
                📧 İletişim
              </div>
            </div>
          </div>
        </div>

        {/* Alt Çizgi ve Telif Hakkı */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © 2024 Görev Takip. AI destekli verimlilik.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span>OpenAI ile desteklenmektedir</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⚡</span>
                <span>Next.js ile geliştirilmiştir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 