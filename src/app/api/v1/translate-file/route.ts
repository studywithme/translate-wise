import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import logger from '@/lib/logger'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

const SUPPORTED_FILE_TYPES = ["srt", "vtt", "txt", "json", "csv"] as const

type FileType = typeof SUPPORTED_FILE_TYPES[number]

const deeplLangMap: Record<string, string> = {
  en: "EN", ja: "JA", zh: "ZH", de: "DE", fr: "FR", es: "ES", it: "IT", ru: "RU", pt: "PT"
}

// 텍스트 번역 함수 (src/app/api/v1/translate/route.ts와 동일)
async function translateText(text: string, targetLanguages: string[], model: string, options: any = {}) {
  let results: Record<string, string> = {}
  switch (model) {
    case "deepl": {
      const apiKey = process.env.DEEPL_API_KEY
      if (!apiKey) throw new Error("DEEPL API 키가 없습니다.")
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
      if (!apiKey) throw new Error("GEMINI API 키가 없습니다.")
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
      if (!apiKey) throw new Error("OPENAI API 키가 없습니다.")
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
      throw new Error(`지원하지 않는 번역 모델: ${model}`)
  }
  return results
}

// SRT 파싱 및 재조립
function parseSRT(srt: string) {
  return srt.split(/\n\n+/).map(block => {
    const lines = block.split("\n")
    return {
      index: lines[0],
      time: lines[1],
      text: lines.slice(2).join("\n"),
    }
  })
}
function buildSRT(blocks: { index: string; time: string; text: string }[]) {
  return blocks.map(b => `${b.index}\n${b.time}\n${b.text}`.trim()).join("\n\n")
}

// VTT 파싱 및 재조립
function parseVTT(vtt: string) {
  const lines = vtt.split(/\r?\n/)
  const blocks = []
  let currentBlock: any = {}
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === "WEBVTT") continue
    if (line === "") {
      if (currentBlock.time && currentBlock.text) {
        blocks.push(currentBlock)
      }
      currentBlock = {}
      continue
    }
    if (/^\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3}/.test(line)) {
      currentBlock.time = line
    } else if (currentBlock.time) {
      if (!currentBlock.text) currentBlock.text = ""
      currentBlock.text += (currentBlock.text ? "\n" : "") + line
    }
  }
  if (currentBlock.time && currentBlock.text) {
    blocks.push(currentBlock)
  }
  return blocks
}
function buildVTT(blocks: { time: string; text: string }[]) {
  return "WEBVTT\n\n" + blocks.map(b => `${b.time}\n${b.text}`.trim()).join("\n\n")
}

export async function POST(req: NextRequest) {
  logger.info('translate-file API 요청');
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    logger.warn('translate-file: API 키 없음');
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: 'API 키가 필요합니다.' } }, { status: 401 });
  }
  const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!key || key.revoked) {
    logger.warn('translate-file: 유효하지 않거나 폐기된 API 키', { apiKey });
    return NextResponse.json({ success: false, error: { code: 'AUTH_ERROR', message: '유효하지 않거나 폐기된 API 키입니다.' } }, { status: 403 });
  }
  // 마지막 사용일 갱신(비동기, 실패 무시)
  prisma.apiKey.update({ where: { key: apiKey }, data: { lastUsedAt: new Date() } }).catch(() => {});
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const targetLanguages = JSON.parse(formData.get("targetLanguages") as string)
    const model = (formData.get("model") as string) || "deepl"
    const fileType = (formData.get("fileType") as string) || "srt"
    logger.debug({ fileType, model, targetLanguages }, 'translate-file 요청 파라미터');
    if (!file || !targetLanguages) {
      logger.warn('translate-file: 파일 또는 타겟 언어 누락');
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "필수 파라미터가 누락되었습니다." } }, { status: 400 })
    }
    const origName = (file as any).name || "file"
    const baseName = origName.replace(/\.[^.]+$/, "")
    const content = await file.text()
    let translatedFiles: Record<string, string> = {}
    switch (fileType) {
      case "srt": {
        const blocks = parseSRT(content)
        for (const lang of targetLanguages) {
          const translatedBlocks = []
          for (const block of blocks) {
            if (!block.text) {
              translatedBlocks.push(block)
              continue
            }
            const result = await translateText(block.text, [lang], model)
            translatedBlocks.push({ ...block, text: result[lang] })
          }
          translatedFiles[lang] = buildSRT(translatedBlocks)
        }
        break
      }
      case "vtt": {
        const blocks = parseVTT(content)
        for (const lang of targetLanguages) {
          const translatedBlocks = []
          for (const block of blocks) {
            if (!block.text) {
              translatedBlocks.push(block)
              continue
            }
            const result = await translateText(block.text, [lang], model)
            translatedBlocks.push({ ...block, text: result[lang] })
          }
          translatedFiles[lang] = buildVTT(translatedBlocks)
        }
        break
      }
      case "txt":
      case "csv": {
        const lines = content.split(/\r?\n/)
        for (const lang of targetLanguages) {
          const translatedLines = []
          for (const line of lines) {
            const result = await translateText(line, [lang], model)
            translatedLines.push(result[lang])
          }
          translatedFiles[lang] = translatedLines.join("\n")
        }
        break
      }
      case "json": {
        try {
          const jsonContent = JSON.parse(content)
          for (const lang of targetLanguages) {
            const translated = await translateJSON(jsonContent, lang, model)
            translatedFiles[lang] = JSON.stringify(translated, null, 2)
          }
        } catch (e) {
          return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "유효하지 않은 JSON 형식입니다." } }, { status: 400 })
        }
        break
      }
      default:
        return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_FILE_TYPE", message: `지원하지 않는 파일 형식: ${fileType}` } }, { status: 400 })
    }
    // 응답: 단일 언어면 바로 파일, 여러 언어면 zip
    if (targetLanguages.length === 1) {
      const lang = targetLanguages[0]
      logger.info('translate-file: 단일 언어 번역 성공', { lang, fileType });
      return new NextResponse(translatedFiles[lang], {
        status: 200,
        headers: {
          "Content-Type": getContentType(fileType),
          "Content-Disposition": `attachment; filename=${baseName}-${lang}.${fileType}`
        }
      })
    } else {
      const zip = new JSZip()
      for (const lang of targetLanguages) {
        zip.file(`${baseName}-${lang}.${fileType}`, translatedFiles[lang])
      }
      const zipBlob = await zip.generateAsync({ type: "uint8array" })
      logger.info('translate-file: 다중 언어 번역 ZIP 성공', { langs: targetLanguages, fileType });
      return new NextResponse(zipBlob, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename=${baseName}-translated.zip`
        }
      })
    }
  } catch (error) {
    logger.error({ err: error }, 'translate-file API 서버 오류');
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "파일 번역 처리 중 오류 발생" } }, { status: 500 })
  }
}

// JSON 객체 번역 (재귀)
async function translateJSON(obj: any, targetLang: string, model: string): Promise<any> {
  if (typeof obj === "string") {
    const result = await translateText(obj, [targetLang], model)
    return result[targetLang]
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateJSON(item, targetLang, model)))
  }
  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateJSON(value, targetLang, model)
    }
    return result
  }
  return obj
}

function getContentType(fileType: string): string {
  switch (fileType) {
    case "json": return "application/json; charset=utf-8"
    case "csv": return "text/csv; charset=utf-8"
    default: return "text/plain; charset=utf-8"
  }
} 