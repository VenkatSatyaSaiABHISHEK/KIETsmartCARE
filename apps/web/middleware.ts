import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyEdgeSessionToken, UserRole } from './lib/auth/edge-session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname, hostname } = request.nextUrl;

  // 1. Allow public static assets and health/auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/student') ||
    pathname.startsWith('/api/clinic') ||
    pathname.startsWith('/public') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return response;
  }

  // 2. Admin subdomain handling (e.g. admin.kiet.edu or admin.localhost:3000)
  const isSubdomainAdmin = hostname.startsWith('admin.');
  if (isSubdomainAdmin && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Root landing page is public; redirect legacy /admin/login to central PIN login
  if (pathname === '/admin/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (pathname === '/' || pathname === '/login') {
    return response;
  }

  // 4. Strict session verification (No cookie spoofing, no insecure role fallbacks)
  const sessionToken = request.cookies.get('kiet_session')?.value;
  let userRole: UserRole | null = null;

  if (sessionToken) {
    const session = await verifyEdgeSessionToken(sessionToken);
    if (session) {
      userRole = session.role;
    }
  }

  // If no valid session token exists, clear cookies and redirect to login
  if (!userRole) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized: Session expired or invalid' },
        { status: 401 }
      );
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    const redirectRes = NextResponse.redirect(redirectUrl);
    redirectRes.cookies.delete('kiet_session');
    redirectRes.cookies.delete('kiet_user_role');
    return redirectRes;
  }

  // 5. Protected portal boundaries
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/doctor') && userRole !== 'doctor') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/officer') && userRole !== 'officer') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
