import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      logger.warn('회원가입: 이메일/비밀번호 누락');
      return NextResponse.json({ success: false, error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
    }
    // 이메일 중복 체크
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn(`회원가입 실패(중복): ${email}`);
      return NextResponse.json({ success: false, error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }
    // 비밀번호 해시
    const hashed = await bcrypt.hash(password, 10);
    // User 생성
    const user = await prisma.user.create({
      data: { email, password: hashed },
      select: { id: true, email: true, createdAt: true }
    });
    logger.info(`회원가입 성공: ${email}`);
    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    logger.error({ err: e }, '회원가입 서버 오류');
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 });
  }
} 