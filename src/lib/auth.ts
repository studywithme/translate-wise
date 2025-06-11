// 인증 및 API 키 유틸리티 (MySQL)
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// API 키 생성
export async function generateApiKey() {
  return `tw_${Math.random().toString(36).substring(2)}_${Date.now()}`
}

// API 키 검증
export async function verifyApiKey(apiKey: string) {
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: {
      id: true,
      plan: true,
      usage: {
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  })
  return user
}

// JWT 토큰 생성
export function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

// 비밀번호 해싱
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
} 