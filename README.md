### Güncel Dosya Yapısı

Projenizdeki son değişikliklere (Server Actions, Auth, Middleware vb.) göre oluşturulan ağaç yapısı şöyledir:

```text
test1-bio/
├── prisma/
│   ├── schema.prisma          # Veritabanı modelleri (User, Category, Celebrity)
│   ├── seed.ts                # Varsayılan veriler
│   └── update-zodiacs.ts      # Yardımcı seed scriptleri
├── public/
│   └── uploads/               # Yüklenen görseller (Docker volume ile kalıcı)
├── src/
│   ├── actions/               # Server Actions (Backend mantığı)
│   │   ├── auth.ts            # Giriş işlemleri
│   │   ├── categories.ts      # Kategori CRUD
│   │   ├── celebrities.ts     # Ünlü CRUD ve arama
│   │   └── upload.ts          # Resim yükleme
│   ├── app/
│   │   ├── admin/             # Admin Paneli (Korumalı Rotalar)
│   │   │   ├── add/           # Yeni ekleme
│   │   │   ├── categories/    # Kategori yönetimi
│   │   │   └── edit/[id]/     # Düzenleme
│   │   ├── api/               # REST API Endpointleri
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── celebrities/   # API CRUD
│   │   │   ├── health/        # Healthcheck
│   │   │   └── search/        # Arama API
│   │   ├── celebrity/[slug]/  # Ünlü Detay Sayfası (Dinamik)
│   │   ├── login/             # Giriş Sayfası
│   │   ├── error.tsx          # Global hata yönetimi
│   │   └── layout.tsx         # Ana layout ve SEO
│   ├── components/
│   │   ├── admin/             # Admin formları ve tabloları
│   │   ├── auth/              # Login formu
│   │   ├── celebrity/         # Profil ve info bileşenleri
│   │   ├── home/              # Ana sayfa grid yapısı
│   │   ├── layout/            # Header ve Footer
│   │   ├── search/            # Gelişmiş arama ve filtreleme
│   │   └── ui/                # Buton, Kart, Toast vb.
│   ├── hooks/                 # Custom Hooks (useToast vb.)
│   ├── lib/                   # Konfigürasyon ve Yardımcılar
│   │   ├── auth.ts            # NextAuth ayarları
│   │   ├── db.ts              # Prisma client
│   │   ├── seo.ts             # Schema.org ve metadata
│   │   └── validations.ts     # Form validasyonları
│   └── middleware.ts          # Rota koruması ve yönlendirme
├── docker-compose.yml         # Production container ayarları
├── Dockerfile                 # Multi-stage Docker yapılandırması
├── next.config.js             # Güvenlik headerları ve resim ayarları
└── tailwind.config.ts         # Stil yapılandırması
```

### Önerilen Yeni README.md İçeriği

Aşağıdaki içeriği kopyalayıp `README.md` dosyanıza yapıştırabilirsiniz. Gereksiz teknik jargonları çıkardım ve doğrudan kuruluma odaklandım.

````markdown
# ⭐ CelebHub - Ünlü Biyografi Platformu

Modern, performanslı ve ölçeklenebilir ünlü biyografi platformu. Next.js 15, Prisma ve PostgreSQL altyapısı ile geliştirilmiştir.

## 🚀 Temel Özellikler

- **Gelişmiş Biyografiler**: Dinamik slug yapısı, burç hesaplama, yaş hesaplama ve detaylı kariyer bilgileri.
- **Yönetim Paneli**: Ünlü ekleme, düzenleme, silme ve kategori yönetimi için güvenli admin arayüzü.
- **Authentication**: NextAuth.js (v5) ile güvenli giriş ve middleware koruması.
- **Gelişmiş Arama**: Debounce özellikli anlık arama, kategori filtreleme ve autocomplete.
- **Medya Yönetimi**: Yerel dosya sistemi veya Docker volume üzerinden resim yükleme ve optimizasyon.
- **SEO & Performans**: Dinamik sitemap, robots.txt, Schema.org yapısal verileri ve SSR.
- **Altyapı**: Docker container desteği, Nginx konfigürasyonu ve Healthcheck endpoint'leri.

## 🛠️ Teknoloji Yığını

- **Framework**: Next.js 15 (App Router & Server Actions)
- **Dil**: TypeScript
- **Veritabanı**: PostgreSQL & Prisma ORM
- **Stil**: Tailwind CSS
- **Auth**: NextAuth.js
- **Devops**: Docker, Docker Compose, PM2

## 📦 Hızlı Kurulum (Docker ile)

En kolay kurulum yöntemidir. Veritabanı, uygulama ve migration işlemleri otomatik yapılır.

1. **Repoyu klonlayın:**
   ```bash
   git clone <repo-url>
   cd test1-bio
````

2.  **Çevresel değişkenleri ayarlayın:**

    ```bash
    cp .env.example .env
    ```

    *.env dosyasındaki `NEXTAUTH_SECRET` değerini güvenli bir anahtarla değiştirmeyi unutmayın.*

3.  **Uygulamayı başlatın:**

    ```bash
    docker-compose up -d --build
    ```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

**Varsayılan Admin Girişi:**

  - Email: `admin@celebhub.com`
  - Şifre: `Admin123!`

## 🔧 Yerel Geliştirme (Localhost)

Docker kullanmadan geliştirmek için:

1.  **Bağımlılıkları yükleyin:**

    ```bash
    npm install
    ```

2.  **Veritabanını hazırlayın:**
    Yerel bir PostgreSQL sunucusu çalıştırın ve `.env` dosyasındaki `DATABASE_URL`'i güncelleyin.

3.  **Migration ve Seed işlemleri:**

    ```bash
    npm run prisma:migrate  # Tabloları oluştur
    npm run prisma:seed     # Admin ve kategorileri yükle
    ```

4.  **Sunucuyu başlatın:**

    ```bash
    npm run dev
    ```

## 📁 Proje Yapısı

```
src/
├── actions/       # Server Actions (Backend mantığı)
├── app/           # Sayfalar ve API (App Router)
│   ├── admin/     # Yönetim paneli sayfaları
│   ├── api/       # REST API endpointleri
│   └── login/     # Giriş sayfası
├── components/    # UI bileşenleri
├── lib/           # Veritabanı, Auth ve Utils
└── public/        # Statik dosyalar ve yüklemeler
```

## 🔒 Güvenlik

  - **Middleware Koruması**: Admin rotaları yetkisiz erişime karşı korunmaktadır.
  - **Input Validation**: Tüm form girişleri sunucu tarafında doğrulanır.
  - **Güvenli Headerlar**: `next.config.js` üzerinden XSS ve diğer saldırılara karşı headerlar ayarlanmıştır.
  - **Resim Güvenliği**: Yüklenen dosyalar tip ve boyut kontrolünden geçer.

## 🚀 Canlı Ortama Alma (Deployment)

-----

MIT Lisansı ile lisanslanmıştır.

```
```
