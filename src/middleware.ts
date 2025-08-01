import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Routes that require authentication
const protectedRoutes = [
  '/api/stores',
  '/api/users',
  '/api/terminals',
  '/api/orders',
  '/api/reports',
]

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/api/stores/public',
]

interface TokenPayload {
  userId: number
  email: string
  role: string
  storeId: string
  terminalId: string
  iat: number
  exp: number
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7).trim()

    // Check if token is empty or obviously malformed
    if (!token || token.length < 10) {
      console.log('Token verification failed: Token is empty or too short')
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
      
      // Validate required fields
      if (!decoded.userId || !decoded.email || !decoded.role) {
        console.log('Token verification failed: Missing required fields in token payload')
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        )
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.log('Token verification failed: Token expired')
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        )
      }

      // Add user info to request headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId.toString())
      requestHeaders.set('x-user-email', decoded.email)
      requestHeaders.set('x-user-role', decoded.role)
      requestHeaders.set('x-store-id', decoded.storeId || '')
      requestHeaders.set('x-terminal-id', decoded.terminalId || '')

      // Create new request with updated headers
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })

      return response

    } catch (error) {
      // More specific error logging
      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          console.log(`Token verification failed: ${error.message}`)
        } else if (error.name === 'TokenExpiredError') {
          console.log('Token verification failed: Token expired')
        } else if (error.name === 'NotBeforeError') {
          console.log('Token verification failed: Token not active')
        } else {
          console.log(`Token verification failed: ${error.name} - ${error.message}`)
        }
      } else {
        console.log('Token verification failed: Unknown error', error)
      }
      
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
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
} 