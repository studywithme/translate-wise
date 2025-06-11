// 요청 제한 및 사용량 추적 (MySQL)
import { prisma } from './db'
import { Plan } from '@prisma/client'

// 요금제별 요청 제한
const RATE_LIMITS = {
  FREE: 1000,        // 일일 1,000회
  BASIC: 10000,     // 일일 10,000회
  PRO: 50000,       // 일일 50,000회
  ENTERPRISE: 100000 // 일일 100,000회
}

// 요청 제한 확인
export async function checkRateLimit(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const usages = await prisma.usage.findMany({
    where: {
      userId,
      date: { gte: today }
    }
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { allowed: false, remaining: 0 }

  const totalRequests = usages.reduce((sum, u) => sum + u.requests, 0)
  const limit = RATE_LIMITS[user.plan as keyof typeof RATE_LIMITS]
  const remaining = Math.max(0, limit - totalRequests)

  return {
    allowed: totalRequests < limit,
    remaining
  }
}

// 사용량 기록
export async function trackUsage(userId: string, data: { characters: number }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.usage.create({
    data: {
      userId,
      requests: 1,
      characters: data.characters,
      date: today
    }
  })
} 