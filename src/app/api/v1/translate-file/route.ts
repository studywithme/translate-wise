import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

// SRT 파싱 함수 (블록 내 줄 배열 유지)
function parseSRT(srt: string) {
  return srt.split(/\n\n+/).map(block => {
    const lines = block.split("\n");
    return {
      index: lines[0],
      time: lines[1],
      lines: lines.slice(2), // 블록 내 자막 줄 배열
    };
  });
}
// SRT 재조립 함수
function buildSRT(blocks: { index: string; time: string; lines: string[] }[]) {
  return blocks.map(b => `${b.index}\n${b.time}\n${b.lines.join("\n")}`.trim()).join("\n\n");
}

// 블록 배치 번역 함수 (배치 크기 50, 각 배치 후 1초 대기)
async function batchTranslateBlocks(blocks: { lines: string[] }[], lang: string, model: string) {
  const batchSize = 10;
  let translatedBlocks: string[][] = [];
  // 언어명 매핑 (필요시 확장)
  const langMap: Record<string, string> = {
    en: "영어",
    ja: "일본어",
    zh: "중국어",
    de: "독일어",
    fr: "프랑스어",
    es: "스페인어",
    // 필요시 추가
  };
  const langLabel = langMap[lang] || lang;
  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    // 각 블록을 [번호]\n내용 형식으로 합침
    const promptBlocks = batch.map((block, idx) => `[#${i + idx + 1}]\n${block.lines.join("\n")}`);
    // 프롬프트: 메타데이터(번호, 시간)는 그대로, 한글만 선택 언어로 번역
    const prompt = `아래 SRT 자막 블록들의 \"번호\"와 \"시간(영상 시작 -> 종료)\" 메타데이터는 그대로 두고, 한글 자막 부분만 자연스러운 ${langLabel}로 번역해줘. 각 블록은 [#번호]로 구분되어 있음.\n\n${promptBlocks.join("\n\n")}`;
    let translatedText = "";
    if (model === "gemini-1.5-flash") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
          }),
        }
      );
      const data = await res.json();
      translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // 번역 API 응답 로그 출력
      console.log("[Gemini 번역 API 응답]", { lang, prompt, data, translatedText });
    } else {
      // 기타 모델은 필요시 추가
      translatedText = batch.map(b => b.lines.join("\n")).join("\n\n");
    }
    // Gemini가 SRT 구조로 반환하면 SRT 파싱으로 블록 분리
    const parsedBlocks = parseSRT(translatedText);
    for (let j = 0; j < batch.length; j++) {
      const origLines = batch[j].lines.length;
      let lines = parsedBlocks[j]?.lines || [];
      // 줄 수 보정
      if (lines.length < origLines) {
        while (lines.length < origLines) lines.push("");
      } else if (lines.length > origLines) {
        lines = [ ...lines.slice(0, origLines-1), lines.slice(origLines-1).join(' ') ];
      }
      translatedBlocks.push(lines);
    }
    // 각 배치마다 1초 대기
    await new Promise(res => setTimeout(res, 1000));
  }
  return translatedBlocks;
}

// POST /api/v1/translate-file
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const targetLanguages = JSON.parse(formData.get("targetLanguages") as string);
  const model = formData.get("model") as string || "gemini-1.5-flash";

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  if (!targetLanguages || !Array.isArray(targetLanguages)) {
    return NextResponse.json({ error: "타겟 언어가 필요합니다." }, { status: 400 });
  }

  // 원본 파일명 추출
  const origName = (file as any).name || "subtitle.srt";
  const baseName = origName.replace(/\.[^.]+$/, "");

  // SRT 파일 텍스트 추출
  const srtText = await file.text();
  const blocks = parseSRT(srtText);

  // 언어별 SRT 파일 생성
  const srtFiles: Record<string, string> = {};
  for (const lang of targetLanguages) {
    // 블록 배치 번역
    const translatedBlockLines = await batchTranslateBlocks(blocks, lang, model);
    // 번역 결과를 SRT 구조로 조립
    const translatedBlocks = blocks.map((block, i) => ({ ...block, lines: translatedBlockLines[i] }));
    srtFiles[lang] = buildSRT(translatedBlocks);
  }

  // 단일 언어면 바로 SRT 반환, 여러 언어면 zip
  if (targetLanguages.length === 1) {
    const lang = targetLanguages[0];
    return new NextResponse(srtFiles[lang], {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename=${baseName}-${lang}.srt`,
      },
    });
  } else {
    // zip 파일 생성
    const zip = new JSZip();
    for (const lang of targetLanguages) {
      zip.file(`${baseName}-${lang}.srt`, srtFiles[lang]);
    }
    const zipBlob = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${baseName}-translated.zip`,
      },
    });
  }
} 