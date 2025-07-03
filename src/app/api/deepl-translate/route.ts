import { NextRequest, NextResponse } from "next/server";

// DeepL 번역 프록시
export async function POST(req: NextRequest) {
  const { text, targetLanguages, tag_handling } = await req.json();
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL API 키가 없습니다." }, { status: 500 });
  }

  // DeepL 언어코드 매핑 (필요시 확장)
  const deeplLangMap: Record<string, string> = {
    en: "EN", ja: "JA", zh: "ZH", de: "DE", fr: "FR", es: "ES", it: "IT", ru: "RU", pt: "PT"
  };

  // 각 언어별로 번역 결과 저장
  const results: Record<string, string> = {};
  for (const lang of targetLanguages) {
    const targetLang = deeplLangMap[lang] || lang.toUpperCase();
    // DeepL 번역 API 호출
    const params: Record<string, string> = {
      text,
      target_lang: targetLang,
    };
    if (tag_handling) {
      params.tag_handling = tag_handling;
    }
    // 디버깅: 최종 params 출력
    console.log('[DeepL 요청 파라미터]', params);
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
      },
      body: new URLSearchParams(params),
    });
    const data = await res.json();
    // 한글 주석: 번역 결과를 서버 로그로 출력
    //console.log(`[DeepL 번역] 대상 언어: ${lang}, 결과:`, data.translations?.[0]?.text);
    results[lang] = data.translations?.[0]?.text || "번역 실패";
  }
  return NextResponse.json({ result: results });
} 