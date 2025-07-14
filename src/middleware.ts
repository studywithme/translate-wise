import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 프록시 API (내부용, API 키 검증 불필요)
  if (pathname.startsWith('/api/proxy-')) {
    return NextResponse.next();
  }
  
  // 인증 관련 엔드포인트는 API 키 검증 예외 처리
  if (
    pathname.startsWith('/api/v1/auth/register') ||
    pathname.startsWith('/api/v1/auth/login') ||
    pathname.startsWith('/api/v1/auth/me') ||
    pathname.startsWith('/api/v1/auth/apikey')
  ) {
    return NextResponse.next();
  }
  
  // Open API - DB 기반 API 키 검증
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: 'API 키가 필요합니다.' } }, { status: 401 })
  }
  
  try {
    const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!key || key.revoked) {
      return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: '유효하지 않거나 폐기된 API 키입니다.' } }, { status: 403 })
    }
    
    // 마지막 사용일 갱신(비동기, 실패 무시)
    prisma.apiKey.update({ where: { key: apiKey }, data: { lastUsedAt: new Date() } }).catch(() => {});
    
    return NextResponse.next()
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: '서버 오류' } }, { status: 500 })
  }
}

export const config = {
  matcher: ['/api/:path*'],
} 