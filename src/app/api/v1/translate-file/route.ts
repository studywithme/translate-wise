import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

// SRT 파싱 함수 (블록 내 줄 배열 유지)
function parseSRT(srt: string) {
  // 윈도우/유닉스 줄바꿈 모두 지원
  return srt
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(block => {
      const lines = block.split('\n').map(line => line.trim());
      return {
        index: lines[0],
        time: lines[1],
        lines: lines.slice(2),// 나머지 줄: 자막 내용 (여러 줄일 수 있음)
      };
    })
    .filter(b => b.index && /^\d+$/.test(b.index) && b.time && b.lines.length > 0);
}

// SRT 재조립 함수
function buildSRT(blocks: { index: string; time: string; lines: string[] }[]) {
  // 각 블록의 내용을 디버깅
  blocks.forEach((b, i) => {
    console.log(`[buildSRT][${i}] index: ${b.index}, time: ${b.time}, lines:`, b.lines);
  });
  // 실제 SRT 조립
  return blocks.map(b => `${b.index}\n${b.time}\n${b.lines.join("\n")}`.trim()).join("\n\n");
}

// Gemini 응답에서 [#번호]\n자막 형태를 파싱
function parseGeminiBlocks(text: string) {
  // [#번호]\n자막 ... [#번호]\n자막 ... 형태를 파싱
  const blocks = text.split(/\n(?=\[#\d+\])/).map(block => {
    const match = block.match(/^\[#(\d+)\]\n?([\s\S]*)$/);
    if (!match) return null;
    return {
      index: match[1],
      lines: match[2].split('\n').map(line => line.trim()).filter(Boolean),
    };
  }).filter(Boolean);
  return blocks as { index: string; lines: string[] }[];
}

// index(번호) 기준으로 100단위로 SRT 블록을 나누어 번역하는 함수
async function splitByIndexAndTranslate(
  blocks: { index: string; time: string; lines: string[] }[],
  lang: string,
  model: string,
  batchSize: number = 100
) {
  // 번호가 숫자인 블록만 추출
  const numberedBlocks = blocks.filter(b => /^\d+$/.test(b.index));
  // batchSize 단위로 그룹핑
  const groups: { index: number; blocks: { index: string; time: string; lines: string[] }[] }[] = [];
  let currentGroup: { index: number; blocks: { index: string; time: string; lines: string[] }[] } = { index: 1, blocks: [] };
  for (const block of numberedBlocks) {
    if (currentGroup.blocks.length === 0) {
      currentGroup.index = parseInt(block.index, 10);
    }
    currentGroup.blocks.push(block);
    if (currentGroup.blocks.length === batchSize) {
      groups.push(currentGroup);
      currentGroup = { index: parseInt(block.index, 10) + 1, blocks: [] };
    }
  }
  if (currentGroup.blocks.length > 0) groups.push(currentGroup);

  // 언어명 매핑 (Gemini용)
  const langMap: Record<string, string> = {
    en: "English",
    ja: "Japanese",
    zh: "Chinese",
    de: "German",
    fr: "French",
    es: "Spanish",
  };
  const langLabel = langMap[lang] || lang;

  let translatedBlocks: string[][] = [];
  for (const group of groups) {
    if (model === "deepl") {
      // DeepL 번역 API 호출 분기
      const texts = group.blocks.map((block) => block.lines.join("\n"));
      // 디버깅: 요청에 보낼 texts 출력
      console.log("[DeepL][요청 texts]", texts);
      // 서버 환경에서 절대경로 필요
      const baseUrl = process.env.INTERNAL_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/deepl-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: texts.join("\n\n"), // 블록별로 두 줄 띄우기
          targetLanguages: [lang],
        }),
      });
      const data = await res.json();
      // 디버깅: DeepL 응답 전체 출력
      console.log("[DeepL][응답 data]", data);
      // 한글 주석: 번역 결과를 \n\n로 분할하여 각 블록에 매핑
      const translated = (data.result?.[lang] || "").split(/\n\n/);
      // 디버깅: 번역 결과 블록별 출력
      console.log("[DeepL][블록별 번역 결과]", translated);
      for (let i = 0; i < group.blocks.length; i++) {
        const origLines = group.blocks[i].lines.length;
        let lines = (translated[i] || "").split("\n");
        if (lines.length < origLines) {
          while (lines.length < origLines) lines.push("");
        } else if (lines.length > origLines) {
          lines = [ ...lines.slice(0, origLines-1), lines.slice(origLines-1).join(' ') ];
        }
        translatedBlocks.push(lines);
      }
      await new Promise(res => setTimeout(res, 1000));
    } else if (model === "gemini-1.5-flash") {
      // 기존 Gemini 로직
      const promptBlocks = group.blocks.map((block) => `[#${block.index}]\n${block.lines.join("\n")}`);
      const prompt = `Translate only the Korean subtitle part in the following blocks into natural ${langLabel}.
Return the result as [#index]\\ntranslated lines. Do not add any explanation or commentary.

${promptBlocks.join("\n\n")}`;
      let translatedText = "";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
          }),
        }
      );
      const data = await res.json();
      translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // 한글 주석: Gemini 번역 API 응답 로그 및 번역 결과 출력
      console.log("[DEBUG] translatedText 원본:", translatedText);
      // Gemini가 [#번호]\n자막 형태로 반환하면 parseGeminiBlocks로 파싱
      const parsedBlocks = parseGeminiBlocks(translatedText);
      const fixedBlocks = [];
      for (let j = 0; j < group.blocks.length; j++) {
        let lines = parsedBlocks[j]?.lines || [];
        if (!parsedBlocks[j]) {
          lines = group.blocks[j].lines.map(() => "");
        }
        const origLines = group.blocks[j].lines.length;
        if (lines.length < origLines) {
          while (lines.length < origLines) lines.push("");
        } else if (lines.length > origLines) {
          lines = [ ...lines.slice(0, origLines-1), lines.slice(origLines-1).join(' ') ];
        }
        translatedBlocks.push(lines);
      }
      await new Promise(res => setTimeout(res, 1000));
    } else {
      // 기타(원본 유지 등)
      for (const block of group.blocks) {
        translatedBlocks.push([...block.lines]);
      }
    }
  }
  translatedBlocks.forEach((block, i) => {
    if (!Array.isArray(block)) {
      console.error(`[ERROR] block[${i}]이 배열이 아님:`, block);
    }
  });
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
    // 번역 대상만 추출
    const numberedBlocks = blocks.filter(b => /^\d+$/.test(b.index));
    const translatedBlockLines = await splitByIndexAndTranslate(numberedBlocks, lang, model, 500);

    console.log("blocks.length:", blocks.length);
    console.log("translatedBlockLines.length:", translatedBlockLines.length);

    let translatedIdx = 0;
    const translatedBlocks = blocks.map((block, i) => {
      if (/^\d+$/.test(block.index)) {
        console.log(`[매핑] block[${i}] index: ${block.index} -> 번역 lines:`, translatedBlockLines[translatedIdx]);
        return { ...block, lines: translatedBlockLines[translatedIdx++] || [] };
      } else {
        return block;
      }
    });
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