import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Her istekte yeniden değerlendirilsin

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Sitenin production domaini olup olmadığını kontrol et
  // Eğer URL içinde "whoo.bio" geçiyorsa production'dır.
  const isProduction = siteUrl.includes('whoo.bio')

  let rules = ''

  if (isProduction) {
    // ✅ CANLI ORTAM (Domain): İzin ver
    rules = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
`
  } else {
    // ⛔ GELİŞTİRME ORTAMI (IP veya Localhost): Hepsini engelle
    rules = `User-agent: *
Disallow: /
`
  }

  const robotsTxt = `# CelebHub - Celebrity Biography Platform
${rules}
# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      // Cache süresini kısa tutalım ki değişiklik anında yansısın
      'Cache-Control': 'public, max-age=0, s-maxage=0', 
    },
  })
}