import { NextRequest, NextResponse } from 'next/server';

const deeplLangMap: Record<string, string> = {
  en: "EN", ja: "JA", zh: "ZH", de: "DE", fr: "FR", es: "ES", it: "IT", ru: "RU", pt: "PT"
}

export async function POST(req: NextRequest) {
  const { text, targetLanguages, model = 'deepl', options = {} } = await req.json();

  // 환경변수에서 DeepL API 키 불러오기
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: { code: 'NO_API_KEY', message: '서버에 DeepL API 키가 없습니다.' } }, { status: 500 });
  }

  // DeepL 번역 API 호출
  const results: Record<string, string> = {};
  for (const lang of targetLanguages) {
    const targetLang = deeplLangMap[lang] || lang.toUpperCase();
    const params: Record<string, string> = {
      text,
      target_lang: targetLang,
    };
    if (options.tag_handling) params.tag_handling = options.tag_handling;
    if (options.preserve_formatting) params.preserve_formatting = "1";

    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
      },
      body: new URLSearchParams(params),
    });
    
    const data = await res.json();
    results[lang] = data.translations?.[0]?.text || "번역 실패";
  }
  
  return NextResponse.json({ success: true, data: { translations: results } });
} 