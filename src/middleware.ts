import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // ── business.unlocked.gr subdomain routing ──
  if (host.startsWith('business.unlocked.gr') || host.startsWith('business.localhost')) {
    // If someone navigates to /company/... on the subdomain, redirect to strip the prefix
    if (pathname.startsWith('/company')) {
      const clean = pathname.replace(/^\/company/, '') || '/';
      const url = request.nextUrl.clone();
      url.pathname = clean;
      return NextResponse.redirect(url);
    }
    // Rewrite root-relative paths to /company/* internally
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/company', request.url));
    }
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/company${pathname}`, request.url));
    }
  }

  // ── photos.unlocked.gr subdomain routing ──
  if (host.startsWith('photos.unlocked.gr') || host.startsWith('photos.localhost')) {
    // Root → /photos-app (standalone photos dashboard)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/photos-app', request.url));
    }

    // /login → /photos-app/login
    if (pathname === '/login') {
      return NextResponse.rewrite(new URL('/photos-app/login', request.url));
    }

    // /register → /photos-app/register
    if (pathname === '/register') {
      return NextResponse.rewrite(new URL('/photos-app/register', request.url));
    }

    // /room/[id] → /photos-app/room/[id]
    if (pathname.startsWith('/room/')) {
      return NextResponse.rewrite(new URL(`/photos-app${pathname}`, request.url));
    }

    // /p/[id] → served as-is (public photo page already exists)
    if (pathname.startsWith('/p/')) {
      return NextResponse.next();
    }

    // Any other path under photos subdomain → /photos-app/[path]
    if (!pathname.startsWith('/photos-app') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      return NextResponse.rewrite(new URL(`/photos-app${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)',
  ],
};
