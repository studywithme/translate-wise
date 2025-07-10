import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '@/lib/logger';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      logger.warn('로그인: 이메일/비밀번호 누락');
      return NextResponse.json({ success: false, error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn(`로그인 실패(이메일 없음): ${email}`);
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(`로그인 실패(비밀번호 불일치): ${email}`);
      return NextResponse.json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    logger.info(`로그인 성공: ${email}`);
    // JWT 발급
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return NextResponse.json({ success: true, data: { token } });
  } catch (e) {
    logger.error({ err: e }, '로그인 서버 오류');
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 