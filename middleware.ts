import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 2. API 경로에 대한 인증 검증
  if (pathname.startsWith('/api/')) {
    // 프록시 API (내부용, API 키 검증 불필요)
    if (pathname.startsWith('/api/proxy-')) {
      return NextResponse.next();
    }
    
    // 인증 관련 엔드포인트는 API 키 검증 예외 처리
    if (
      pathname.startsWith('/api/v1/auth/register') ||
      pathname.startsWith('/api/v1/auth/login') ||
      pathname.startsWith('/api/v1/auth/me') ||
      pathname.startsWith('/api/v1/auth/apikey') ||
      pathname.startsWith('/api/health')
    ) {
      return NextResponse.next();
    }
    
    // Open API - API 키 헤더 존재만 체크 (실제 검증은 각 API Route에서)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'API 키가 필요합니다.' } }, 
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// API 경로에 대해서만 미들웨어가 동작하도록 설정
export const config = {
  matcher: ['/api/:path*'],
}; 