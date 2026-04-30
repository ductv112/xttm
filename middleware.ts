import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Match all routes except:
  // - /api/auth/* (NextAuth handlers)
  // - /api/* (API routes — auth handled at route handler level)
  // - /_next/static, /_next/image (assets)
  // - /favicon.ico, /robots.txt, /sitemap.xml
  // - /fonts/* (public fonts cho PDF)
  // - /mock-files/* (public mock files cho demo)
  // - /logo-*.svg (public logo assets)
  matcher: [
    '/((?!api/auth|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|fonts|mock-files|logo-).*)',
  ],
};
