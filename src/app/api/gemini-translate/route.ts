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

  // 각 언어별로 번역 결과 생성
  const results: Record<string, string> = {};
  for (const lang of targetLanguages) {
    // 프롬프트: 입력 언어에 상관없이 동작하도록 수정
    const prompt = `Translate the following text to ${lang}: ${text}`;
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
    results[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패";
  }
  return NextResponse.json({ result: results });
} 