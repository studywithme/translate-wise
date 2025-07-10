import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';

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
    if (!token) {
      return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    if (typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ success: false, error: '토큰이 유효하지 않습니다.' }, { status: 401 });
    }
    // 기존 키 모두 폐기
    await prisma.apiKey.updateMany({ where: { userId: (payload as JwtPayload).userId, revoked: false }, data: { revoked: true } });
    // 새 키 발급
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = await prisma.apiKey.create({
      data: { userId: (payload as JwtPayload).userId, key },
      select: { id: true, key: true, createdAt: true }
    });
    return NextResponse.json({ success: true, data: apiKey });
  } catch (e) {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 