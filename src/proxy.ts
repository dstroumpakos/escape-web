import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PREVIEW_COOKIE, previewPassword, previewToken } from '@/lib/previewGate';

// Reachable without the preview password (see src/lib/previewGate.ts)
function isGateExempt(pathname: string) {
  return (
    pathname === '/coming-soon' ||
    pathname === '/api/preview-access' ||
    // Widget guests confirm bookings from email links (no preview cookie)
    pathname === '/verify-email' ||
    pathname === '/robots.txt' ||
    // The phone app's WebView pages (they hold no data; the app sends it in)
    pathname.startsWith('/embed/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/_next')
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // ── "Coming soon" password gate (on while PREVIEW_PASSWORD is set) ──
  const password = previewPassword();
  if (password) {
    if (isGateExempt(pathname)) {
      // Serve as-is on every host, before any subdomain rewrites
      return NextResponse.next();
    }
    const token = request.cookies.get(PREVIEW_COOKIE)?.value;
    if (token !== (await previewToken(password))) {
      const url = request.nextUrl.clone();
      url.pathname = '/coming-soon';
      url.search = '';
      if (pathname !== '/') {
        url.searchParams.set('next', pathname + request.nextUrl.search);
      }
      const resp = NextResponse.redirect(url);
      resp.headers.set('X-Robots-Tag', 'noindex');
      return resp;
    }
  }

  // ── business.unlocked.gr subdomain routing ──
  if (host.startsWith('business.unlocked.gr') || host.startsWith('business.localhost')) {
    // If someone navigates to /company/... on the subdomain, redirect to strip the prefix
    if (pathname.startsWith('/company')) {
      const clean = pathname.replace(/^\/company/, '') || '/';
      const url = request.nextUrl.clone();
      url.pathname = clean;
      const resp = NextResponse.redirect(url);
      resp.cookies.set('x-subdomain', 'business', { path: '/' });
      return resp;
    }
    // Rewrite root-relative paths to /company/* internally
    let resp: NextResponse;
    if (pathname === '/') {
      resp = NextResponse.rewrite(new URL('/company', request.url));
    } else if (pathname.startsWith('/admin')) {
      // Admin page lives at /admin, not /company/admin — serve as-is
      resp = NextResponse.next();
    } else if (
      pathname.startsWith('/services') ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/contact') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/cookies') ||
      pathname.startsWith('/for-escape-rooms')
    ) {
      // Public pages served as-is on business subdomain
      resp = NextResponse.next();
    } else if (!pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      resp = NextResponse.rewrite(new URL(`/company${pathname}`, request.url));
    } else {
      resp = NextResponse.next();
    }
    resp.cookies.set('x-subdomain', 'business', { path: '/' });
    return resp;
  }

  // ── photos.unlocked.gr subdomain routing ──
  if (host.startsWith('photos.unlocked.gr') || host.startsWith('photos.localhost')) {
    let resp: NextResponse;

    // Root → /photos-app (standalone photos dashboard)
    if (pathname === '/') {
      resp = NextResponse.rewrite(new URL('/photos-app', request.url));
    }
    // /login → /photos-app/login
    else if (pathname === '/login') {
      resp = NextResponse.rewrite(new URL('/photos-app/login', request.url));
    }
    // /register → /photos-app/register
    else if (pathname === '/register') {
      resp = NextResponse.rewrite(new URL('/photos-app/register', request.url));
    }
    // /room/[id] → /photos-app/room/[id]
    else if (pathname.startsWith('/room/')) {
      resp = NextResponse.rewrite(new URL(`/photos-app${pathname}`, request.url));
    }
    // /p/[id] → served as-is (public photo page already exists)
    else if (pathname.startsWith('/p/')) {
      resp = NextResponse.next();
    }
    // Any other path under photos subdomain → /photos-app/[path]
    else if (!pathname.startsWith('/photos-app') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
      resp = NextResponse.rewrite(new URL(`/photos-app${pathname}`, request.url));
    } else {
      resp = NextResponse.next();
    }

    resp.cookies.set('x-subdomain', 'photos', { path: '/' });
    return resp;
  }

  // Main domain — clear subdomain cookie if present
  const resp = NextResponse.next();
  if (request.cookies.has('x-subdomain')) {
    resp.cookies.delete('x-subdomain');
  }
  return resp;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)',
  ],
};
