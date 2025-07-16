import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '@/lib/logger'

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.replace('Bearer ', '');
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    logger.info('apikey 발급 API 요청', { token: token ? '있음' : '없음' });
    if (!token) {
      logger.warn('apikey: 토큰 없음');
      return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      logger.warn('apikey: 토큰 검증 실패');
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    if (typeof payload !== 'object' || !('userId' in payload)) {
      logger.warn('apikey: payload에 userId 없음');
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    // 이미 발급된 키가 있으면 에러
    const existing = await prisma.apiKey.findFirst({ where: { userId: (payload as JwtPayload).userId, revoked: false } });
    if (existing) {
      logger.warn('apikey: 이미 발급된 키 있음', { userId: (payload as JwtPayload).userId });
      return NextResponse.json({ success: false, error: '이미 발급된 API 키가 있습니다.' }, { status: 409 });
    }
    // 키 생성(랜덤)
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = await prisma.apiKey.create({
      data: { userId: (payload as JwtPayload).userId, key },
      select: { id: true, key: true, createdAt: true }
    });
    logger.info('apikey: 키 발급 성공', { userId: (payload as JwtPayload).userId });
    // 최초 1회만 노출
    return NextResponse.json({ success: true, data: apiKey });
  } catch (e) {
    logger.error({ err: e }, 'apikey 발급 API 서버 오류');
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 