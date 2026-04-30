import type { NextAuthConfig } from 'next-auth';
import type { Role } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'] as const;

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isPublic = PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/'),
      );

      if (isPublic) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      // All non-public routes require auth
      if (!isLoggedIn) {
        const callbackUrl = pathname + nextUrl.search;
        const loginUrl = new URL('/login', nextUrl);
        if (pathname !== '/' && pathname !== '/dashboard') {
          loginUrl.searchParams.set('next', callbackUrl);
        }
        return Response.redirect(loginUrl);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username as string;
        token.fullName = user.fullName as string;
        token.role = user.role as Role;
        token.organizationId = (user.organizationId as string | null) ?? null;
        token.organizationName = (user.organizationName as string | null) ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.fullName = token.fullName as string;
        session.user.role = token.role as Role;
        session.user.organizationId = (token.organizationId as string | null) ?? null;
        session.user.organizationName = (token.organizationName as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
