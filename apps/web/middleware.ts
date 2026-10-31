import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route prefixes per role
const ROLE_PERMITTED_ROUTES: Record<string, string[]> = {
  doctor: ['/doctor', '/api/doctor'],
  officer: ['/officer', '/api/officer'],
  admin: ['/admin', '/api/admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // 1. Allow public assets, internal next assets, and health api
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 2. Admin subdomain handling (e.g. admin.kiet.edu or admin.localhost:3000)
  const isSubdomainAdmin = hostname.startsWith('admin.');
  if (isSubdomainAdmin && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Root landing page is public for staff login
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 4. Role authentication token & cookie simulation / Supabase SSR session token
  // During scaffold, cookies or mock role tokens determine access; real Supabase auth session token will be integrated in Prompt 6 (database/auth part)
  const roleCookie = request.cookies.get('kiet_user_role')?.value;

  // Route protection rules:
  // - /admin pages only open for the admin role (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (roleCookie && roleCookie !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = roleCookie === 'doctor' ? '/doctor' : '/officer';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // - /doctor pages only open for doctor role
  if (pathname.startsWith('/doctor')) {
    if (roleCookie && roleCookie !== 'doctor') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = roleCookie === 'admin' ? '/admin' : '/officer';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // - /officer pages only open for officer role
  if (pathname.startsWith('/officer')) {
    if (roleCookie && roleCookie !== 'officer') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = roleCookie === 'admin' ? '/admin' : '/doctor';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
