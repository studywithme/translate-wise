// 요청 제한 및 사용량 추적 (테스트용, DB/Redis 미사용)

// 사용량 제한 확인 (임시: 항상 허용)
export async function checkRateLimit(userId: string) {
  return { success: true, remaining: 999999 }
}

// 사용량 추적 (임시: 아무 동작 안함)
export async function trackUsage(userId: string, type: 'text' | 'file', characters: number) {
  return
} 