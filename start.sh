#!/bin/sh
set -e

echo "Veritabanı bağlantısı kontrol ediliyor..."

# Postgres portunun (5432) açılmasını bekle
until nc -z -v -w30 postgres 5432
do
  echo "Veritabanı bağlantısı bekleniyor... (5 saniye sonra tekrar denenecek)"
  sleep 5
done

echo "✅ Veritabanı bağlantısı başarılı!"

echo "📦 Migrationlar uygulanıyor..."
# DÜZELTME: npx yerine doğrudan binary yolunu kullanıyoruz
./node_modules/.bin/prisma migrate deploy

echo "🌱 Seed data yükleniyor..."
# Seed işlemi için de aynı şekilde
./node_modules/.bin/prisma db seed || echo "⚠️ Seed işlemi atlandı veya hata oluştu (kritik değil)"

echo "🚀 Uygulama başlatılıyor..."
node server.js