import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// Route group (auth) maps to root: /login, /signup, /forgot-password, /verify-email
const PUBLIC_PATHS = [
  '/',
  '/products',
  '/product',
  '/nfc-verification',
  '/seller',
  // Auth pages (note: (auth) route group has NO /auth prefix in URL)
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
];

const AUTH_PATHS = ['/login', '/signup', '/forgot-password', '/verify-email', '/reset-password'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('trusta_session')?.value;
  const session = await decrypt(token);

  // Already logged in → redirect away from auth pages
  if (session && isAuthPath(pathname)) {
    const dest =
      session.role === 'admin' ? '/admin' :
      session.role === 'seller' ? '/seller/dashboard' :
      '/account';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Let public paths through (no auth needed)
  if (isPublic(pathname)) return NextResponse.next();

  // Not logged in → redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (pathname.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/seller/dashboard') && session.role !== 'seller') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admins don't use the customer area
  if (
    (pathname.startsWith('/account') || pathname.startsWith('/cart') ||
     pathname.startsWith('/checkout') || pathname.startsWith('/my-products')) &&
    session.role === 'admin'
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
