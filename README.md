# 🎯 AI Destekli Görev Takip Sistemi

Bu proje, Next.js 14, MongoDB, NextAuth ve OpenAI entegrasyonu ile geliştirilmiş modern bir görev yönetim uygulamasıdır.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- **Email/Şifre ile giriş** - Güvenli şifre hash'leme
- **Google OAuth** - Tek tıkla giriş
- **Session yönetimi** - NextAuth ile güvenli oturum kontrolü

### 📋 Görev Yönetimi
- **CRUD İşlemleri** - Görev ekleme, listeleme, silme
- **Kullanıcıya özel görevler** - Her kullanıcı kendi görevlerini görür
- **Responsive tasarım** - Mobil uyumlu arayüz

### 🤖 AI Özellikleri (OpenAI Entegrasyonu)
- **AI Görev Önerileri** - Konu bazlı akıllı görev önerileri
- **Otomatik Açıklama** - Görev başlığından AI ile açıklama oluşturma
- **Öncelik Analizi** - AI ile görev öncelik belirleme (gelecekte)
- **Kategori Önerisi** - AI ile görev kategorilendirme (gelecekte)

## 🛠️ Teknolojiler

- **Framework:** Next.js 14 (App Router)
- **Veritabanı:** MongoDB
- **Kimlik Doğrulama:** NextAuth.js
- **UI Kütüphanesi:** Shadcn/UI + Tailwind CSS
- **AI:** OpenAI GPT-3.5-turbo
- **Şifreleme:** bcryptjs
- **TypeScript:** Tam tip güvenliği

## 🚀 Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repo-url>
cd task-tracker
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın
`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# MongoDB bağlantı dizesi
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# NextAuth yapılandırması
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth kimlik bilgileri
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API anahtarı
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 4. Geliştirme sunucusunu başlatın
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 📱 Kullanım

### Kayıt/Giriş
1. Uygulamayı açın
2. "Kayıt Ol" ile hesap oluşturun veya "Giriş Yap" ile mevcut hesabınızla giriş yapın
3. Google hesabınızla da tek tıkla giriş yapabilirsiniz

### AI Görev Asistanı
1. **Görev Önerileri:** Bir konu girin (örn: "ev temizliği") ve AI'dan öneriler alın
2. **Otomatik Açıklama:** Görev başlığı girin ve "AI ile Oluştur" butonuna tıklayın
3. **Önerileri Kullan:** AI önerilerini "Kullan" butonu ile doğrudan forma aktarın

### Görev Yönetimi
1. **Yeni Görev:** Başlık ve açıklama girerek görev ekleyin
2. **Görev Listesi:** Tüm görevlerinizi görüntüleyin
3. **Görev Silme:** İstemediğiniz görevleri silin

## 🏗️ Proje Yapısı

```
src/
├── app/                      # Next.js App Router
│   ├── api/                 # API endpoints
│   │   ├── auth/           # Authentication APIs
│   │   ├── tasks/          # Task CRUD APIs
│   │   └── ai/             # AI integration APIs
│   ├── auth/               # Auth pages (signin/signup)
│   ├── providers/          # Context providers
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   ├── Navbar.tsx         # Navigation bar
│   └── Footer.tsx         # Footer
└── lib/                   # Utility libraries
    ├── mongodb.ts         # Database connection
    ├── authOptions.ts     # NextAuth config
    └── openai.ts          # OpenAI integration
```

## 🎯 AI Özellikleri Detayı

### Görev Önerileri
AI, girdiğiniz konuya göre 5 adet pratik ve uygulanabilir görev önerisi oluşturur:
- Konu: "ev temizliği" → Mutfak temizliği, banyo temizliği, vs.
- Konu: "proje yönetimi" → Zaman çizelgesi, ekip toplantısı, vs.

### Otomatik Açıklama
Görev başlığına göre detaylı açıklama oluşturur:
- Başlık: "Web sitesi güncellemesi" → "Mevcut web sitesindeki içerikleri gözden geçir ve güncel bilgilerle değiştir..."

### Gelecek Özellikler
- **Öncelik Analizi:** AI görevlerin aciliyet seviyesini belirler
- **Kategori Önerisi:** Görevleri otomatik kategorilere ayırır
- **Akıllı Hatırlatıcılar:** AI ile optimize edilmiş bildirimler

## 🔧 Geliştirme

### API Endpoints
- `GET/POST/DELETE /api/tasks` - Görev CRUD işlemleri
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/ai/suggestions` - AI görev önerileri
- `POST /api/ai/description` - AI açıklama oluşturma

### Database Schema
```javascript
// Users koleksiyonu
{
  name: string,
  email: string,
  password: string, // bcrypt hash
  createdAt: Date
}

// Tasks koleksiyonu
{
  title: string,
  description: string,
  userId: string,
  priority?: string,    // AI tarafından belirlenen
  category?: string,    // AI tarafından belirlenen
  createdAt: Date
}
```

## 🛡️ Güvenlik

- **Şifre Hash'leme:** bcrypt ile 12 round
- **Session Yönetimi:** JWT tabanlı güvenli oturumlar
- **API Güvenliği:** Input validasyonu ve rate limiting
- **MongoDB Injection:** Parameterized queries

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 İletişim

Herhangi bir sorunuz için issue açabilirsiniz.

---
💡 **İpucu:** OpenAI API anahtarı olmadan da uygulama çalışır, sadece AI özellikleri devre dışı kalır.
