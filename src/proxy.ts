import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth/config';

const PUBLIC_PATHS: string[] = ['/login'];

const isPublic = (pathname: string): boolean => {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    // Allow API routes
    pathname.startsWith('/api')

    // Allow public paths
    || isPublic(pathname)

    // Allow static files
    || pathname.startsWith('/_next')
    || pathname.startsWith('/static')
    || (/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|otf)$/.exec(pathname))
  ) return NextResponse.next();

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
