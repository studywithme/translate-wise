import { NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth"
import { checkRateLimit, trackUsage } from "@/lib/rate-limit"

// 주요 API 라우트 (한글 주석 포함)
export async function POST(req: NextRequest) {
  try {
    // API 키 검증
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 필요합니다." },
        { status: 401 }
      )
    }

    const user = await verifyApiKey(apiKey)
    if (!user) {
      return NextResponse.json(
        { error: "유효하지 않은 API 키입니다." },
        { status: 401 }
      )
    }

    // 요청 제한 확인
    const rateLimitResult = await checkRateLimit(user.id)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "요청 제한에 도달했습니다.",
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      )
    }

    // 요청 데이터 검증
    const { text, targetLanguages, model = "gpt-4o-mini" } = await req.json()
    if (!text || !targetLanguages) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      )
    }

    // 번역 실행 (text가 string 또는 string[] 모두 지원)
    const results = await translateText(text, targetLanguages, model)

    // 사용량 추적 (string[]이면 전체 글자수 합산)
    const charCount = Array.isArray(text) ? text.reduce((sum, t) => sum + t.length, 0) : text.length
    await trackUsage(user.id, {
      characters: charCount
    })

    return NextResponse.json({
      success: true,
      data: results,
      usage: {
        characters: charCount,
        languages: targetLanguages.length,
        remaining: rateLimitResult.remaining
      }
    })
  } catch (error) {
    console.error("번역 API 에러:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// 번역 함수 (string 또는 string[] 모두 지원)
async function translateText(text: string | string[], targetLanguages: string[], model: string) {
  const results: Record<string, string | string[]> = {}
  for (const lang of targetLanguages) {
    if (Array.isArray(text)) {
      // 자막 등 줄 단위 번역: 각 줄을 개별 번역
      const translatedLines: string[] = [];
      for (const line of text) {
        const prompt = `Translate the following Korean text to ${lang}: ${line}`;
        if (model === "gpt-4o-mini") {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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
          translatedLines.push(data.choices?.[0]?.message?.content || "번역 실패")
        } else if (model === "gemini-1.5-flash") {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  { role: "user", parts: [{ text: prompt }] }
                ],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
              }),
            }
          )
          const data = await res.json()
          translatedLines.push(data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패")
        }
      }
      results[lang] = translatedLines;
    } else {
      // 기존 컨텐츠 번역 (문단 전체)
      const prompt = `Translate the following Korean text to ${lang}: ${text}`
      if (model === "gpt-4o-mini") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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
      } else if (model === "gemini-1.5-flash") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: prompt }] }
              ],
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            }),
          }
        )
        const data = await res.json()
        results[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패"
      }
    }
  }
  return results
} 