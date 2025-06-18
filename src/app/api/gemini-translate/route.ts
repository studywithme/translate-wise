import { NextRequest, NextResponse } from "next/server";

// Gemini 1.5 Flash 번역 프록시
export async function POST(req: NextRequest) {
  // 요청에서 max_tokens도 받아옴 (없으면 1024)
  const { text, targetLanguages, max_tokens } = await req.json();
  // 환경변수에서 Gemini API 키 가져오기
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 없습니다." }, { status: 500 });
  }

  // 각 언어별로 번역 결과 및 토큰 수 저장
  const results: Record<string, string> = {};
  const tokenUsage: Record<string, number> = {};
  for (const lang of targetLanguages) {
    // 프롬프트: 번역만 출력, 설명/코멘트 없이
    const prompt = `Translate only the following text to ${lang}. Output only the translation, no explanation or commentary:\n\n${text}`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: prompt }] }
          ],
          // max_tokens가 있으면 사용, 없으면 1024
          generationConfig: { temperature: 0.3, maxOutputTokens: max_tokens || 1024 },
        }),
      }
    );
    const data = await res.json();
    // 한글 주석: Gemini API 응답 로그 출력
    console.log("[Gemini 번역 API 응답]", { lang, prompt, data });
    results[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패";
    // 한글 주석: usageMetadata.totalTokenCount(요청+응답 토큰 합계) 추출
    tokenUsage[lang] = data.usageMetadata?.totalTokenCount || 0;
  }
  // 한글 주석: 번역 결과와 토큰 사용량을 함께 반환
  return NextResponse.json({ result: results, tokenUsage });
} 