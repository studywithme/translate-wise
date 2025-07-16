import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import logger from '@/lib/logger'

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.replace('Bearer ', '');
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    logger.info('auth/me API 요청', { token: token ? '있음' : '없음' });
    if (!token) {
      logger.warn('auth/me: 토큰 없음');
      return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      logger.warn('auth/me: 토큰 검증 실패');
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    if (typeof payload !== 'object' || !('userId' in payload)) {
      logger.warn('auth/me: payload에 userId 없음');
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: (payload as JwtPayload).userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        apiKeys: {
          select: { id: true, key: true, revoked: true, createdAt: true, lastUsedAt: true }
        }
      }
    });
    if (!user) {
      logger.warn('auth/me: 사용자 없음', { userId: (payload as JwtPayload).userId });
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    logger.info('auth/me: 사용자 정보 반환', { userId: user.id });
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    logger.error({ err: e }, 'auth/me API 서버 오류');
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 