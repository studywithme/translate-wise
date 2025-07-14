// 인증 및 API 키 유틸리티 (MySQL)
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


// API 키 생성 함수
export function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const prefix = 'tw_'
  let key = prefix
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
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