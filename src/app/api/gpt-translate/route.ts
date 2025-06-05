import { NextRequest, NextResponse } from "next/server";

// GPT-4o mini 번역 프록시
export async function POST(req: NextRequest) {
  const { text, targetLanguages } = await req.json();
  // 환경변수에서 OpenAI API 키 가져오기
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 없습니다." }, { status: 500 });
  }

  // 각 언어별로 번역 결과 생성
  const results: Record<string, string> = {};
  for (const lang of targetLanguages) {
    // 실제로는 system prompt 등으로 언어 지정 필요
    const prompt = `Translate the following Korean text to ${lang}: ${text}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a professional translator.` },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    results[lang] = data.choices?.[0]?.message?.content || "번역 실패";
  }
  return NextResponse.json({ result: results });
} 