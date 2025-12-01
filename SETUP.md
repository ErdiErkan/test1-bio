# 🚀 Kurulum Rehberi - Production-Ready Next.js Ünlü Biyografi Platformu

Bu rehber, projenin production-ready versiyonunu kurmak için gerekli adımları içerir.

## ✨ Yeni Özellikler

### 1. **Authentication (NextAuth.js)**
- ✅ Email/şifre ile giriş sistemi
- ✅ Admin paneli koruması (middleware)
- ✅ Modern login sayfası

### 2. **Kategori Sistemi**
- ✅ Esnek kategori yönetimi (Many-to-Many)
- ✅ Bir ünlü birden fazla kategoriye ait olabilir
- ✅ Admin panelinde kategori CRUD sayfası
- ✅ Varsayılan kategoriler (Oyuncu, Müzisyen, Yönetmen, Sporcu, vb.)

### 3. **Resim Yükleme**
- ✅ Local dosya yükleme (Server Actions)
- ✅ Dosya tipi ve boyut kontrolü (max 5MB, JPG/PNG/WEBP)
- ✅ Resim önizleme
- ✅ Persistent storage (Docker volume)

### 4. **Gelişmiş Arama ve Filtreleme**
- ✅ Autocomplete (yazarken tahmin eden)
- ✅ Debounced search (300ms)
- ✅ Kategori filtreleme
- ✅ URL parametreleri ile arama

### 5. **Docker Optimizasyonu**
- ✅ PostgreSQL healthcheck
- ✅ Otomatik migration (prisma migrate deploy)
- ✅ Otomatik seed data
- ✅ Persistent volumes (uploads + database)

## 📋 Kurulum Adımları

### 1. Dependencies Yükleme

```bash
npm install
```

### 2. Environment Variables

`.env` dosyası oluşturun (`.env.example` dosyasını kopyalayın):

```bash
cp .env.example .env
```

**Önemli:** `.env` dosyasındaki şu değerleri güncelleyin:

```env
# NextAuth Secret (güvenlik için değiştirin!)
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Production'da bu değeri güncelleyin
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` oluşturmak için:

```bash
openssl rand -base64 32
```

### 3. Docker ile Başlatma

**Tüm servisleri başlat (PostgreSQL + Next.js):**

```bash
docker-compose up --build
```

Bu komut:
1. ✅ PostgreSQL veritabanını başlatır
2. ✅ Healthcheck ile veritabanının hazır olmasını bekler
3. ✅ Prisma migration'ları otomatik çalıştırır (`migrate deploy`)
4. ✅ Seed data'yı otomatik yükler (kategoriler + admin kullanıcı)
5. ✅ Next.js uygulamasını başlatır

**Arka planda çalıştırmak için:**

```bash
docker-compose up -d
```

**Logları görmek için:**

```bash
docker-compose logs -f
```

**Servisleri durdurmak için:**

```bash
docker-compose down
```

### 4. Local Development (Docker olmadan)

**PostgreSQL'i ayrı çalıştırıyorsanız:**

```bash
# Migration çalıştır
npm run prisma:migrate

# Seed data yükle
npm run prisma:seed

# Development server başlat
npm run dev
```

## 🔐 Giriş Bilgileri

Varsayılan admin kullanıcısı:

- **Email:** `admin@celebhub.com`
- **Şifre:** `Admin123!`

**⚠️ PRODUCTION'DA MUTLAKA DEĞİŞTİRİN!**

## 📂 Proje Yapısı

```
├── prisma/
│   ├── schema.prisma          # Güncellenmiş şema (User, Category, Celebrity)
│   └── seed.ts                # Seed data (kategoriler + admin)
├── src/
│   ├── actions/               # Server Actions (YENI)
│   │   ├── upload.ts          # Resim yükleme
│   │   ├── categories.ts      # Kategori CRUD
│   │   └── celebrities.ts     # Ünlü CRUD + Arama
│   ├── app/
│   │   ├── admin/
│   │   │   ├── categories/    # Kategori yönetimi (YENI)
│   │   │   └── ...
│   │   ├── login/             # Login sayfası (YENI)
│   │   └── api/
│   │       └── auth/          # NextAuth routes (YENI)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── CategoriesManager.tsx   # Kategori CRUD UI (YENI)
│   │   │   └── CelebrityForm.tsx       # Güncellenmiş (upload + kategoriler)
│   │   ├── auth/              # Login UI (YENI)
│   │   └── search/            # Gelişmiş arama (YENI)
│   ├── lib/
│   │   └── auth.ts            # NextAuth config (YENI)
│   └── middleware.ts          # Route protection (YENI)
├── public/
│   └── uploads/               # Yüklenen resimler (volume)
└── docker-compose.yml         # Güncellenmiş (healthcheck + volumes)
```

## 🎯 Kullanım

### Admin Paneli

1. `/login` adresinden giriş yapın
2. `/admin` - Ünlü listesi ve yönetimi
3. `/admin/categories` - Kategori yönetimi
4. `/admin/add` - Yeni ünlü ekle (resim upload + kategori seçimi)

### Kullanıcı Arayüzü

1. Ana sayfa: Gelişmiş arama ve filtreleme
2. Autocomplete: 2+ karakter yazınca öneriler gelir
3. Kategori filtreleme: Butonlarla filtrele
4. URL paylaşımı: `/?q=kemal&category=oyuncu`

## 🔧 Prisma Komutları

```bash
# Prisma Studio (veritabanı görsel yönetimi)
npm run prisma:studio

# Migration oluştur
npm run prisma:migrate

# Migration deploy (production)
npm run prisma:migrate:deploy

# Seed data yükle
npm run prisma:seed

# Database reset (dikkat!)
npm run db:reset
```

## 🐳 Docker Komutları

```bash
# Build
docker-compose build

# Başlat
docker-compose up

# Arka planda başlat
docker-compose up -d

# Durdur
docker-compose down

# Volumes ile birlikte sil (dikkat! veriler silinir)
docker-compose down -v

# Logları göster
docker-compose logs -f

# Sadece app loglarını göster
docker-compose logs -f app

# Sadece postgres loglarını göster
docker-compose logs -f postgres
```

## 📝 Migration Notları

Veritabanı şemasında yapılan değişiklikler:

1. **User modeli** - Authentication için
2. **Category modeli** - Kategori sistemi
3. **Celebrity.categories** - Many-to-Many ilişki
4. **Implicit join table** - Prisma otomatik oluşturur (`_CategoryToCelebrity`)

Migration otomatik olarak Docker başlatıldığında çalışır.

## 🔒 Güvenlik Notları

1. ✅ Admin rotaları middleware ile korunuyor
2. ✅ NextAuth session JWT ile
3. ✅ Password bcrypt ile hashlenmiş
4. ⚠️ Production'da `NEXTAUTH_SECRET` değiştirin
5. ⚠️ Production'da admin şifresini değiştirin
6. ⚠️ Rate limiting ekleyin (gelecek)

## 🚀 Deployment

Production'a deploy ederken:

1. Environment variables'ı güncelleyin
2. `NEXTAUTH_SECRET` yeni değer
3. `NEXTAUTH_URL` production URL
4. Admin şifresini değiştirin
5. `docker-compose up` otomatik migration yapacak

## 📞 Destek

Sorun yaşarsanız:

1. Docker loglarını kontrol edin: `docker-compose logs -f`
2. Veritabanı bağlantısını kontrol edin
3. `.env` dosyasını kontrol edin

---

**🎉 Artık production-ready bir Next.js uygulamanız var!**
