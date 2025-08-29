import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Protected routes that require payment validation
const PAYWALLED_ROUTES = {
  '/dashboard/company': 'company_registration',
  '/courses/[id]/learn': 'course_learning',
  '/dashboard': 'progress_tracking',
  '/admin': 'admin_access'
}

// Routes that are always accessible
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/courses',
  '/auth/signin',
  '/auth/signup',
  '/register/company',
  '/api/auth'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route is paywalled
  const paywallFeature = getPaywallFeature(pathname)
  if (!paywallFeature) {
    return NextResponse.next()
  }

  // Get session token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  if (!token) {
    // Redirect to signin if not authenticated
    const signinUrl = new URL('/auth/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  // For admin routes, check admin role
  if (paywallFeature === 'admin_access') {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // For other paywalled routes, check access
  const hasAccess = await checkPaywallAccess(token.sub!, paywallFeature)
  
  if (!hasAccess) {
    // Redirect to appropriate page based on feature
    const redirectUrl = getRedirectUrl(paywallFeature, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

function getPaywallFeature(pathname: string): string | null {
  // Check exact matches first
  if (pathname === '/dashboard/company') return 'company_registration'
  if (pathname === '/dashboard') return 'progress_tracking'
  if (pathname === '/admin') return 'admin_access'
  
  // Check pattern matches
  if (pathname.match(/^\/courses\/[^\/]+\/learn$/)) return 'course_learning'
  
  return null
}

function getRedirectUrl(feature: string, baseUrl: string): URL {
  switch (feature) {
    case 'company_registration':
      return new URL('/register/company', baseUrl)
    
    case 'course_learning':
    case 'progress_tracking':
      return new URL('/courses', baseUrl)
    
    case 'admin_access':
      return new URL('/dashboard', baseUrl)
    
    default:
      return new URL('/', baseUrl)
  }
}

async function checkPaywallAccess(userId: string, feature: string): Promise<boolean> {
  // For now, allow access to all authenticated users
  // This can be enhanced later with proper payment validation
  return true
}

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
}
