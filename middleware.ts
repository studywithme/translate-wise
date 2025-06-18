import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 루트(/) 접근 시 /translate-task로 리다이렉트
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/translate-task', request.url));
  }
  return NextResponse.next();
}

// 모든 경로에 대해 미들웨어가 동작하도록 설정 (특히 루트 포함)
export const config = {
  matcher: ['/', '/:path*'],
}; 