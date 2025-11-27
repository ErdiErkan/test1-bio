# 🌟 Ünlü Biyografi Platformu - MVP

Basit ve kullanışlı bir ünlü biyografi platformu. Ünlüleri listeleyin, arayın ve yönetin.

## 🚀 Özellikler

- ✅ Ana sayfa ile ünlü listesi
- ✅ Gelişmiş arama işlevi
- ✅ Ünlü profil sayfaları
- ✅ Admin paneli (CRUD işlemleri)
- ✅ Responsive tasarım
- ✅ PostgreSQL veritabanı
- ✅ TypeScript desteği
- ✅ Modern UI/UX

## 🛠️ Teknoloji Stack

- **Frontend:** Next.js 14 (App Router)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** TailwindCSS
- **Language:** TypeScript
- **Deployment:** Vercel Ready

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- PostgreSQL 14.x veya üzeri
- npm veya yarn

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

### 3. Veritabanı Kurulumu

PostgreSQL veritabanı oluşturun:

```bash
createdb celebrity_mvp
```

### 4. Environment Variables

`.env` dosyası oluşturun:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/celebrity_mvp"
```

### 5. Prisma Kurulumu

```bash
# Prisma Client oluştur
npx prisma generate

# Veritabanı tablolarını oluştur
npx prisma db push

# (Opsiyonel) Örnek veri ekle
npx prisma db seed
```

### 6. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📁 Proje Yapısı

```
celebrity-mvp/
├── prisma/
│   └── schema.prisma          # Veritabanı şeması
├── src/
│   ├── app/
│   │   ├── page.tsx          # Ana sayfa
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global stiller
│   │   ├── celebrity/
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Ünlü profil sayfası
│   │   ├── admin/
│   │   │   └── page.tsx      # Admin panel
│   │   └── api/              # API endpoints
│   │       ├── celebrities/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── search/
│   │           └── route.ts
│   ├── components/
│   │   ├── CelebrityCard.tsx # Ünlü kartı component
│   │   ├── SearchBar.tsx     # Arama çubuğu component
│   │   └── AdminForm.tsx     # Admin form component
│   └── lib/
│       ├── db.ts             # Prisma client
│       ├── types.ts          # TypeScript tipler
│       └── utils.ts          # Yardımcı fonksiyonlar
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
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

## 🔌 API Endpoints

### Celebrities

- `GET /api/celebrities` - Tüm ünlüleri listele
- `GET /api/celebrities/[id]` - Tek ünlü getir
- `POST /api/celebrities` - Yeni ünlü ekle
- `PUT /api/celebrities/[id]` - Ünlü güncelle
- `DELETE /api/celebrities/[id]` - Ünlü sil

### Search

- `GET /api/search?q=query` - Ünlü ara

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

## 🚀 Deployment (Vercel)

### 1. Vercel'e Deploy

```bash
npm install -g vercel
vercel
```

### 2. Environment Variables Ekleyin

Vercel Dashboard'dan `DATABASE_URL` environment variable'ını ekleyin.

### 3. Database Migration

Production veritabanınızı oluşturun:

```bash
npx prisma db push
```

## 🔍 Özellikler ve Detaylar

### Arama Fonksiyonu

- Gerçek zamanlı arama (debounce ile optimize edilmiş)
- İsim ve meslek üzerinden arama
- Dropdown sonuç listesi
- Otomatik tamamlama

### Türkçe Karakter Desteği

- URL'lerde Türkçe karakterler otomatik dönüştürülür
- Slug'lar SEO uyumludur

### Responsive Tasarım

- Mobile-first yaklaşım
- Grid layout (1 sütun mobile, 2 sütun tablet, 3 sütun desktop)
- Responsive tablolar

## 🐛 Sorun Giderme

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL servisinin çalıştığından emin olun
sudo service postgresql start

# Bağlantı bilgilerini kontrol edin
psql -U username -d celebrity_mvp
```

### Prisma Client Hatası

```bash
# Prisma client'ı yeniden oluşturun
npx prisma generate
```

### Port Kullanımda Hatası

```bash
# Farklı port kullanın
npm run dev -- -p 3001
```

## 📝 Sonraki Adımlar

MVP tamamlandıktan sonra eklenebilecek özellikler:

- [ ] Kullanıcı kimlik doğrulama sistemi
- [ ] Çoklu dil desteği
- [ ] Gelişmiş arama filtreleri
- [ ] Kategori sistemi
- [ ] Popülerlik sıralaması
- [ ] SEO optimizasyonu
- [ ] Resim yükleme özelliği
- [ ] Cache mekanizması
- [ ] Rate limiting
- [ ] Unit ve integration testler

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not:** Bu bir MVP (Minimum Viable Product) versiyonudur. Production kullanımı için güvenlik önlemleri, authentication ve daha fazla test gereklidir.
