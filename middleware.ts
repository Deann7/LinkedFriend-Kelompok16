import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get path
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register' || path === '/';

  // Get token from cookies
  const token = request.cookies.get('token')?.value || '';

  // If trying to access a protected route without token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login/register page with a valid token, redirect to dashboard
  if (isPublicPath && token) {
    try {
      // Verify token (You would normally verify against your JWT_SECRET here)
      // This is a simplified example
      const JWT_SECRET = process.env.JWT_SECRET || 'linkedfriend-secret-key';
      jwt.verify(token, JWT_SECRET);
      
      // If token is valid and user is trying to access login/register page, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // If token is invalid, clear it and continue to the login/register page
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (API endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
