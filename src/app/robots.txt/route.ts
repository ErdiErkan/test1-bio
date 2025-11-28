import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `# CelebHub - Celebrity Biography Platform
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

# Sitemap
Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
