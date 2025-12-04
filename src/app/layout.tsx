import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/hooks/useToast'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ✅ DOĞRU: Viewport ve ThemeColor burada tanımlı
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'CelebHub - Ünlü Biyografileri',
    template: '%s | CelebHub',
  },
  description: 'Favori ünlülerinin biyografilerini keşfet. Detaylı bilgiler, doğum tarihleri, kariyer bilgileri ve daha fazlası.',
  keywords: ['ünlü', 'biyografi', 'celebrity', 'biyografi platformu', 'ünlü kişiler', 'hayat hikayesi'],
  authors: [{ name: 'CelebHub Team' }],
  creator: 'CelebHub',
  publisher: 'CelebHub',
  applicationName: 'CelebHub',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: siteUrl,
    siteName: 'CelebHub',
    title: 'CelebHub - Ünlü Biyografileri',
    description: 'Favori ünlülerinin biyografilerini keşfet',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CelebHub - Ünlü Biyografileri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CelebHub - Ünlü Biyografileri',
    description: 'Favori ünlülerinin biyografilerini keşfet',
    images: ['/og-image.png'],
  },
  robots: {
    index: false, // Google indexlemesini engellemek için devre dışı bırakıldı
    follow: true,
    googleBot: {
      index: false, // Google indexlemesini engellemek için devre dışı bırakıldı
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
  manifest: '/manifest.json',
  // ❌ BURADAN viewport ve themeColor ALANLARI SİLİNDİ (Çünkü yukarıya taşıdık)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ToastProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}