import { NextRequest, NextResponse } from "next/server"
import logger from '@/lib/logger';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

const deeplLangMap: Record<string, string> = {
  en: "EN", ja: "JA", zh: "ZH", de: "DE", fr: "FR", es: "ES", it: "IT", ru: "RU", pt: "PT"
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    logger.warn('translate: API 키 없음');
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: 'API 키가 필요합니다.' } }, { status: 401 });
  }
  const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!key || key.revoked) {
    logger.warn('translate: 유효하지 않거나 폐기된 API 키', { apiKey });
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: '유효하지 않거나 폐기된 API 키입니다.' } }, { status: 403 });
  }
  // 마지막 사용일 갱신(비동기, 실패 무시)
  prisma.apiKey.update({ where: { key: apiKey }, data: { lastUsedAt: new Date() } }).catch(() => {});
  // 미들웨어에서 이미 API 키 검증 완료, 비즈니스 로직만 처리
  try {
    const { text, targetLanguages, model, options = {} } = await req.json()
    logger.debug({ text, targetLanguages, model }, 'translate 요청 파라미터');
    if (!text || !targetLanguages) {
      logger.warn('translate: 필수 파라미터 누락');
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "필수 파라미터가 누락되었습니다." } }, { status: 400 })
    }
    const selectedModel = model || "deepl"
    let results: Record<string, string> = {}
    switch (selectedModel) {
      case "deepl": {
        const apiKey = process.env.DEEPL_API_KEY
        if (!apiKey) return NextResponse.json({ success: false, error: { code: "NO_API_KEY", message: "DEEPL API 키가 없습니다." } }, { status: 500 })
        for (const lang of targetLanguages) {
          const targetLang = deeplLangMap[lang] || lang.toUpperCase()
          const params: Record<string, string> = {
            text,
            target_lang: targetLang,
          }
          if (options.tag_handling) params.tag_handling = options.tag_handling
          if (options.preserve_formatting) params.preserve_formatting = "1"
          const res = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `DeepL-Auth-Key ${apiKey}`,
            },
            body: new URLSearchParams(params),
          })
          const data = await res.json()
          results[lang] = data.translations?.[0]?.text || "번역 실패"
        }
        break
      }
      case "gemini-1.5-flash": {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return NextResponse.json({ success: false, error: { code: "NO_API_KEY", message: "GEMINI API 키가 없습니다." } }, { status: 500 })
        for (const lang of targetLanguages) {
          const prompt = `Translate only the following text to ${lang}. Output only the translation, no explanation or commentary:\n\n${text}`
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [ { role: "user", parts: [{ text: prompt }] } ],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
              }),
            }
          )
          const data = await res.json()
          results[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패"
        }
        break
      }
      case "gpt-4o-mini": {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return NextResponse.json({ success: false, error: { code: "NO_API_KEY", message: "OPENAI API 키가 없습니다." } }, { status: 500 })
        for (const lang of targetLanguages) {
          const prompt = `Translate the following text to ${lang}: ${text}`
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "You are a professional translator." },
                { role: "user", content: prompt },
              ],
              max_tokens: 1024,
              temperature: 0.3,
            }),
          })
          const data = await res.json()
          results[lang] = data.choices?.[0]?.message?.content || "번역 실패"
        }
        break
      }
      default:
        return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_MODEL", message: `지원하지 않는 번역 모델: ${selectedModel}` } }, { status: 400 })
    }
    logger.info('번역 API 요청 성공', { model, langs: targetLanguages });
    return NextResponse.json({ success: true, data: { translations: results } })
  } catch (error) {
    logger.error({ err: error }, '번역 API 서버 오류');
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "번역 처리 중 오류 발생" } }, { status: 500 })
  }
} 