/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    // Docker ortamında işlemci/bellek sorunlarını aşmak için optimizasyonu kapatıyoruz
    unoptimized: true, // Nginx direkt dosya sunacağı için bu TRUE olmalı
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Tüm dış kaynaklara (Wikimedia, vb.) izin ver
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // DÜZELTME: 'origin-when-cross-origin' yerine 'no-referrer-when-downgrade' kullanıldı.
            // Bu, Wikimedia gibi hassas CDN'lerin görseli bloklamasını engeller.
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig