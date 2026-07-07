import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/courses',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/register/company',
  '/api/auth',
  '/api/webhooks',
]

// Lightweight, Edge-safe auth gate.
//
// We intentionally do NOT instantiate the Supabase client here: it pulls in
// supabase-js/realtime-js (which reference Node globals like `__dirname`) and
// crashes the Edge runtime with MIDDLEWARE_INVOCATION_FAILED. Middleware only
// needs to keep logged-out users out of protected pages; the real session
// validation and role checks happen in the API routes (requireAuth /
// requireAdmin) and in the page components themselves, so a cookie-presence
// check is sufficient defense-in-depth at this layer.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  if (isPublic) return NextResponse.next()

  // Supabase SSR stores the session in cookie(s) named `sb-<ref>-auth-token`
  // (optionally chunked with `.0`, `.1`, …). Their presence means a session.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))

  if (!hasSession) {
    const signinUrl = new URL('/auth/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
