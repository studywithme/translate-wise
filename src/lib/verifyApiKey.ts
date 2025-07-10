import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function verifyApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    return { ok: false, status: 401, error: 'API 키가 필요합니다.' };
  }
  const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!key || key.revoked) {
    return { ok: false, status: 403, error: '유효하지 않거나 폐기된 API 키입니다.' };
  }
  // 마지막 사용일 갱신(비동기, 실패 무시)
  prisma.apiKey.update({ where: { key: apiKey }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { ok: true, userId: key.userId };
} 