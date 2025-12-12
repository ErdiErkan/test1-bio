import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Admin Route Protection Strategy

  // Check if path contains /admin (e.g. /en/admin, /tr/admin, /admin) or localized variants like /yonetim
  // Note: /competitions and /competition are PUBLIC, so we only protect explicit admin paths
  const protectedPrefixes = ['/admin', '/yonetim', '/verwaltung'];
  const isAdminPath = protectedPrefixes.some(prefix => pathname.includes(prefix));

  if (isAdminPath) {
    // If user is not logged in
    if (!req.auth) {
      // --- DÜZELTME BAŞLANGICI ---

      // 1. Mevcut dili URL'den tespit etmeye çalış
      const segments = pathname.split('/');
      const maybeLocale = segments[1]; // Örneğin: /tr/admin -> 'tr', /admin -> 'admin'

      // Eğer URL'deki ilk kısım geçerli bir dil ise onu kullan, değilse varsayılan dili (en) kullan
      const locale = routing.locales.includes(maybeLocale as any)
        ? maybeLocale
        : routing.defaultLocale;

      // 2. Login sayfasının o dildeki yolunu bul
      // routing.ts dosyasındaki pathnames ayarını kontrol ediyoruz
      // (TypeScript hatası almamak için 'any' kullanıyoruz)
      const pathnames = (routing as any).pathnames || {};
      const loginRouteConfig = pathnames['/login'];

      let loginPath = '/login';

      if (typeof loginRouteConfig === 'object') {
        // Eğer dile özel path tanımlıysa onu al (Örn: tr için '/giris')
        loginPath = loginRouteConfig[locale] || '/login';
      } else if (typeof loginRouteConfig === 'string') {
        loginPath = loginRouteConfig;
      }

      // 3. Doğru URL'e yönlendir: /{locale}/{loginPath}
      // Örnek: /tr/giris veya /en/login
      const targetUrl = `/${locale}${loginPath}`;

      const loginUrl = new URL(targetUrl, req.nextUrl.origin);
      // Geri dönüş URL'ini de koru
      loginUrl.searchParams.set('callbackUrl', pathname);

      return NextResponse.redirect(loginUrl);
      // --- DÜZELTME BİTİŞİ ---
    }

    // Optional: Role Based Access Control (RBAC)
    if ((req.auth.user as any)?.role !== 'admin') {
      // Yetkisiz ise ana sayfaya at (yine dili koruyarak)
      const segments = pathname.split('/');
      const maybeLocale = segments[1];
      const locale = routing.locales.includes(maybeLocale as any) ? maybeLocale : routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, req.nextUrl.origin));
    }
  }

  // 2. Internationalization Routing
  return intlMiddleware(req);
});

export const config = {
  // Skip all internal paths (_next), api routes, and static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
