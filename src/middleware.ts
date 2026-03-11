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
