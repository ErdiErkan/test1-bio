import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ünlü Biyografi Platformu',
  description: 'Ünlü kişilerin biyografilerine ulaşın',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
