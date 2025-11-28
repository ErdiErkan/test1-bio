# ⭐ CelebHub - Ünlü Biyografi Platformu

Modern, performant ve production-ready ünlü biyografi platformu. Next.js 14, TypeScript ve TailwindCSS ile geliştirilmiştir.

## 🚀 Özellikler

- ✅ **Ünlü Profilleri**: Detaylı biyografiler, resimler, doğum tarihleri ve kariyer bilgileri
- ✅ **Gelişmiş Arama**: Gerçek zamanlı arama (debounced)
- ✅ **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- ✅ **Modern UI**: Gradient tasarımlar ve Tailwind CSS
- ✅ **Yüksek Performans**: Next.js 14 App Router ve Server Components
- ✅ **Admin Panel**: Form validasyon ve toast bildirimleri ile tam CRUD işlemleri
- ✅ **PostgreSQL + Prisma**: Güçlü veritabanı yönetimi
- ✅ **SEO Optimizasyonu**: Dynamic metadata, sitemap ve robots.txt
- ✅ **Docker Desteği**: Production-ready konteynerizasyon
- ✅ **PM2 Desteği**: Process yönetimi ve clustering
- ✅ **Güvenlik**: Security headers, XSS koruması, SQL injection koruması
- ✅ **Error Handling**: Global error boundaries ve loading states
- ✅ **PWA Ready**: Progressive Web App manifest

## 🛠️ Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Deployment**: Docker, PM2, Vercel
- **Image Optimization**: Next.js Image component
- **Process Management**: PM2
- **Containerization**: Docker & Docker Compose

## 📋 Gereksinimler

- Node.js 18+
- PostgreSQL 15+
- npm veya yarn
- Git
- Docker (opsiyonel, production için önerilir)
- PM2 (opsiyonel, production için önerilir)

## 🔧 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd celebrity-mvp
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/celebrity_db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="CelebHub"
```

### 4. Veritabanı Kurulumu

```bash
# Prisma Client oluştur
npm run prisma:generate

# Migrationları çalıştır
npm run prisma:migrate

# (Opsiyonel) Örnek veri ekle
npm run prisma:seed
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
test1-bio/
├── prisma/
│   └── schema.prisma          # Veritabanı şeması
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── celebrities/   # Celebrity CRUD APIs
│   │   │   ├── health/        # Health check endpoint
│   │   │   ├── robots.txt/    # SEO robots.txt
│   │   │   └── sitemap.xml/   # Dynamic sitemap
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── add/
│   │   │   ├── edit/[id]/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── celebrity/[slug]/  # Celebrity profile pages
│   │   │   ├── loading.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── page.tsx
│   │   ├── error.tsx          # Global error page
│   │   ├── loading.tsx        # Global loading page
│   │   ├── not-found.tsx      # 404 page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── admin/             # Admin components
│   │   │   └── CelebrityForm.tsx
│   │   ├── celebrity/         # Celebrity components
│   │   │   ├── CelebrityHeader.tsx
│   │   │   ├── CelebrityInfo.tsx
│   │   │   └── CelebrityProfile.tsx
│   │   ├── home/              # Homepage components
│   │   │   └── CelebrityGrid.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                # Shared UI components
│   │       ├── BackButton.tsx
│   │       ├── CelebrityCard.tsx
│   │       └── SearchBar.tsx
│   ├── hooks/
│   │   └── useToast.tsx       # Toast notification hook
│   └── lib/
│       ├── celebrity.ts       # Celebrity utilities
│       ├── db.ts              # Prisma client
│       ├── types.ts           # TypeScript types
│       ├── utils.ts           # Helper functions
│       └── validations.ts     # Form validations
├── .env.example               # Environment variables template
├── .env.local.example         # Local dev environment template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker configuration
├── ecosystem.config.js        # PM2 configuration
├── next.config.js             # Next.js configuration
├── package.json               # Project dependencies
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── README.md                  # Bu dosya
└── DEPLOYMENT.md              # Deployment kılavuzu
```

## 🎯 Kullanım

### Ana Sayfa

- Son eklenen 6 ünlüyü görüntüleyin
- Arama çubuğu ile ünlü arayın
- Ünlü kartlarına tıklayarak profil sayfasına gidin

### Ünlü Profil Sayfası

- Ünlünün fotoğrafını görün
- İsim, meslek, doğum tarihi ve yeri bilgilerini görüntüleyin
- Detaylı biyografi okuyun

### Admin Panel

- `/admin` adresinden admin panele erişin
- Yeni ünlü ekleyin
- Mevcut ünlüleri düzenleyin
- Ünlüleri silin
- Tüm ünlüleri listeleyin

## 🎯 Kullanılabilir Scriptler

### Development
- `npm run dev` - Development sunucusu
- `npm run build` - Production build
- `npm run start` - Production sunucusu
- `npm run lint` - ESLint çalıştır
- `npm run type-check` - TypeScript type checking

### Database
- `npm run prisma:generate` - Prisma Client oluştur
- `npm run prisma:migrate` - Database migrationları
- `npm run prisma:migrate:deploy` - Migration deploy (production)
- `npm run prisma:studio` - Prisma Studio aç
- `npm run db:push` - Schema değişikliklerini push et
- `npm run db:reset` - Database resetle

### Production
- `npm run production:build` - Prisma ile production build
- `npm run production:start` - Production modda başlat
- `npm run deploy` - Tam deployment (build + restart)

### PM2
- `npm run pm2:start` - PM2 ile başlat
- `npm run pm2:stop` - PM2 process durdur
- `npm run pm2:restart` - PM2 restart
- `npm run pm2:delete` - PM2 process sil
- `npm run pm2:logs` - PM2 logları görüntüle
- `npm run pm2:monit` - PM2 monitoring

## 🔌 API Endpoints

### Celebrities
- `GET /api/celebrities?page=1&limit=12&search=query` - Ünlüleri listele (pagination + search)
- `GET /api/celebrities/[id]` - Tek ünlü getir (ID veya slug ile)
- `POST /api/celebrities` - Yeni ünlü ekle
- `PUT /api/celebrities/[id]` - Ünlü güncelle
- `DELETE /api/celebrities/[id]` - Ünlü sil

### SEO & Health
- `GET /api/health` - Health check endpoint
- `GET /robots.txt` - Robots.txt
- `GET /sitemap.xml` - Dynamic sitemap

## 🗄️ Veritabanı Şeması

```prisma
model Celebrity {
  id          String   @id @default(cuid())
  name        String
  profession  String?
  birthDate   DateTime?
  birthPlace  String?
  bio         String?
  image       String?
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🐳 Docker Deployment

### Docker Compose ile (Önerilir)

```bash
# Servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f
```

### Docker ile

```bash
# Image oluştur
docker build -t celebhub .

# Container çalıştır
docker run -p 3000:3000 --env-file .env celebhub
```

## 🚀 Production Deployment

Detaylı deployment talimatları için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

### PM2 ile Hızlı Başlangıç

```bash
# PM2'yi global olarak yükle
npm install -g pm2

# Uygulamayı build et
npm run production:build

# PM2 ile başlat
npm run pm2:start

# PM2 yapılandırmasını kaydet
pm2 save

# Sistem başlangıcında otomatik başlat
pm2 startup
```

## 🎨 Önemli Özellikler

### Admin Panel
- Tam CRUD işlemleri
- Gerçek zamanlı form validasyonu
- Toast bildirimleri
- Silme onay modalları
- Responsive tablo ve inline işlemler
- Karakter sayacı (bio için 5000 karakter limiti)

### Ünlü Profilleri
- SEO optimizasyonu ile dynamic metadata
- OpenGraph ve Twitter card desteği
- Doğum tarihinden yaş hesaplama
- Responsive resim optimizasyonu
- Loading states ve error boundaries
- Back button ve breadcrumb navigation

### Arama Fonksiyonu
- Debounced search (500ms)
- Gerçek zamanlı sonuçlar
- İsim, meslek ve bio'da arama
- Responsive grid layout
- Pagination desteği

### Güvenlik Özellikleri
- Security headers (HSTS, CSP, X-Frame-Options, vb.)
- Input validasyon ve sanitization
- Prisma ile SQL injection koruması
- XSS koruması
- Environment variable validasyonu
- Rate limiting hazır (gelecek geliştirme)

## 🌐 SEO Özellikleri

- Dynamic sitemap oluşturma
- Robots.txt konfigürasyonu
- Meta tag optimizasyonu
- OpenGraph desteği
- Twitter Cards
- Structured data hazır
- PWA manifest
- Canonical URL'ler

## 🐛 Sorun Giderme

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL servisinin çalıştığından emin olun
sudo systemctl status postgresql

# Bağlantı bilgilerini test edin
psql -U username -d celebrity_db
```

### Build Hataları

```bash
# Next.js cache temizle
rm -rf .next

# Prisma Client yeniden oluştur
npm run prisma:generate

# Rebuild
npm run build
```

### Docker Sorunları

```bash
# Tüm container ve volume'leri kaldır
docker-compose down -v

# Sıfırdan rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Port Kullanımda Hatası

```bash
# Farklı port kullan
PORT=3001 npm run dev
```

## 📝 Gelecek Geliştirmeler

Platform tamamlandı ve production-ready durumda. Gelecek geliştirmeler için fikirler:

- [ ] Kullanıcı kimlik doğrulama sistemi (NextAuth.js)
- [ ] Çoklu dil desteği (i18n)
- [ ] Gelişmiş arama filtreleri (kategori, tarih, vb.)
- [ ] Kategori ve tag sistemi
- [ ] Popülerlik ve trend sıralaması
- [ ] Local image upload sistemi
- [ ] Redis cache mekanizması
- [ ] Rate limiting middleware
- [ ] Unit ve integration testler (Jest, Testing Library)
- [ ] Analytics entegrasyonu (Google Analytics)
- [ ] Email bildirimleri
- [ ] Social media paylaşım özellikleri
- [ ] Yorumlar ve değerlendirmeler
- [ ] Favoriler sistemi

## 🔒 Güvenlik

Bu platform production kullanımı için güvenlik özellikleri içerir:

- Security headers (HSTS, CSP, X-Frame-Options)
- Input validation ve sanitization
- SQL injection koruması
- XSS koruması
- Environment variable encryption
- Secure session management (eklenebilir)

Güvenlik sorunları için lütfen issue açın veya güvenlik@ ile iletişime geçin.

## 📊 Performans

- Next.js 14 App Router ile optimize edilmiş rendering
- Server Components ile reduced JavaScript bundle
- Image optimization ile AVIF/WebP formatları
- Database indexing ile hızlı sorgular
- Compression ve caching headers
- Lazy loading ve code splitting

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 👥 Yazarlar

- CelebHub Team

## 🙏 Teşekkürler

- Next.js ekibine harika framework için
- Prisma ekibine mükemmel ORM için
- Tailwind CSS ekibine utility-first CSS framework için

## 📞 Destek

Destek için:
1. Önce logları kontrol edin
2. Bu kılavuzu gözden geçirin
3. Mevcut issue'ları arayın
4. Yeni issue açın

## 📚 Dökümantasyon

- [README.md](./README.md) - Genel bakış ve kurulum
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detaylı deployment kılavuzu
- [.env.example](./.env.example) - Environment variables

---

❤️ ile Next.js 14, TypeScript ve Tailwind CSS kullanılarak geliştirildi.
