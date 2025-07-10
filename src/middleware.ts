import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 인증 관련 엔드포인트는 API 키 검증 예외 처리
  if (
    pathname.startsWith('/api/v1/auth/register') ||
    pathname.startsWith('/api/v1/auth/login') ||
    pathname.startsWith('/api/v1/auth/me') ||
    pathname.startsWith('/api/v1/auth/apikey')
  ) {
    return NextResponse.next();
  }
  const apiKey = request.headers.get('x-api-key')
  // API 키 검증
  if (!apiKey || (apiKey !== process.env.NEXT_PUBLIC_API_KEY && apiKey !== process.env.INTERNAL_API_KEY)) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: 'API 키가 필요하거나 유효하지 않습니다.' } }, { status: 401 })
  }
  // 요청 제한(테스트 환경에서는 항상 허용)
  // 실제 운영에서는 Redis 등에서 체크
  // if (rateLimitExceeded(apiKey)) {
  //   return NextResponse.json({ success: false, error: { code: 'RATE_LIMIT', message: '요청 제한 초과' } }, { status: 429 })
  // }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
} 