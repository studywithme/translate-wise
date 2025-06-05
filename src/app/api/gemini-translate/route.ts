import { NextRequest, NextResponse } from "next/server";

// Gemini 1.5 Flash 번역 프록시
export async function POST(req: NextRequest) {
  const { text, targetLanguages } = await req.json();
  // 환경변수에서 Gemini API 키 가져오기
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 없습니다." }, { status: 500 });
  }

  // 각 언어별로 번역 결과 생성
  const results: Record<string, string> = {};
  for (const lang of targetLanguages) {
    // 실제로는 system prompt 등으로 언어 지정 필요
    const prompt = `Translate the following Korean text to ${lang}: ${text}`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    );
    const data = await res.json();
    results[lang] = data.candidates?.[0]?.content?.parts?.[0]?.text || "번역 실패";
  }
  return NextResponse.json({ result: results });
} 