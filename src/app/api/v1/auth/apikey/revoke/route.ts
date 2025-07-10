import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';

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
    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ success: false, error: 'key 값이 필요합니다.' }, { status: 400 });
    }
    // 본인 소유의 키만 폐기
    const apiKey = await prisma.apiKey.findUnique({ where: { key } });
    if (!apiKey || apiKey.userId !== (payload as JwtPayload).userId) {
      return NextResponse.json({ success: false, error: '권한이 없거나 존재하지 않는 키입니다.' }, { status: 403 });
    }
    if (apiKey.revoked) {
      return NextResponse.json({ success: false, error: '이미 폐기된 키입니다.' }, { status: 409 });
    }
    await prisma.apiKey.update({ where: { key }, data: { revoked: true } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 