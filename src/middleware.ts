import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Admin Route Protection Strategy
  // Check if path contains /admin (e.g. /en/admin, /tr/admin, /admin)
  const isAdminPath = pathname.includes('/admin');

  if (isAdminPath) {
    // If user is not logged in
    if (!req.auth) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      // Preserve the return URL
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Optional: Role Based Access Control (RBAC)
    if ((req.auth.user as any)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  // 2. Internationalization Routing
  return intlMiddleware(req);
});

export const config = {
  // Skip all internal paths (_next), api routes, and static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};