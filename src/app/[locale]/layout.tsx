import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ToastProvider } from '@/hooks/useToast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

// Global CSS import yolunu düzeltiyoruz (bir üst klasöre çıktığı için ../)
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CelebHub - Ünlü Biyografileri',
    template: '%s | CelebHub',
  },
  description: 'Favori ünlülerinin biyografilerini keşfet.',
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }> // Next.js 15 için Promise tipinde
}) {
  // Params'ı await ediyoruz
  const { locale } = await params;

  // Gelen dilin desteklenip desteklenmediğini kontrol et
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Çeviri mesajlarını sunucudan al
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}