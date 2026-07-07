import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured in this environment, don't crash the whole
  // site — middleware runs on every route, so a throw here 500s everything.
  // Let the request through and rely on the per-page / per-API auth guards.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[middleware] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh session — required for Server Components to pick up the updated session
    const { data: { user } } = await supabase.auth.getUser()

    const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    if (isPublic) return response

    // Protect all non-public routes
    if (!user) {
      const signinUrl = new URL('/auth/signin', request.url)
      signinUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signinUrl)
    }

    // Protect admin routes — role from user_metadata or ADMIN_EMAIL env var
    if (pathname.startsWith('/admin')) {
      const role = user.user_metadata?.role
      const isAdminEmail = user.email === process.env.ADMIN_EMAIL
      if (role !== 'ADMIN' && !isAdminEmail) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch (err) {
    // A transient auth/network error must not take down every route with a 500.
    // Fail open; page- and API-level guards still enforce access.
    console.error('[middleware] auth check failed:', err)
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
