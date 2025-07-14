import { NextRequest, NextResponse } from 'next/server';
import JSZip from "jszip"

const SUPPORTED_FILE_TYPES = ["srt", "vtt", "txt", "json", "csv"] as const

type FileType = typeof SUPPORTED_FILE_TYPES[number]

const deeplLangMap: Record<string, string> = {
  en: "EN", ja: "JA", zh: "ZH", de: "DE", fr: "FR", es: "ES", it: "IT", ru: "RU", pt: "PT"
}

// SRT 파싱
function parseSRT(srt: string) {
  const blocks = srt.trim().split(/\n\s*\n/).map(block => {
    const lines = block.trim().split('\n');
    const index = lines[0];
    const time = lines[1];
    const text = lines.slice(2).join('\n');
    return { index, time, text };
  });
  return blocks;
}

// SRT 생성
function buildSRT(blocks: { index: string; time: string; text: string }[]) {
  return blocks.map(block => `${block.index}\n${block.time}\n${block.text}`).join('\n\n');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const targetLanguages = JSON.parse(formData.get('targetLanguages') as string)
    const model = (formData.get('model') as string) || 'deepl'
    const fileType = (formData.get('fileType') as string) || 'srt'

    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 필요합니다.' }, { status: 400 })
    }

    const content = await file.text()
    const results: Record<string, string> = {}

    // SRT 파일 처리 (예시)
    if (fileType === 'srt') {
      const blocks = parseSRT(content)
      
      for (const lang of targetLanguages) {
        const translatedBlocks = []
        
        for (const block of blocks) {
          // 환경변수에서 API 키 가져오기
          const apiKey = process.env.DEEPL_API_KEY
          if (!apiKey) {
            return NextResponse.json({ success: false, error: 'DEEPL API 키가 없습니다.' }, { status: 500 })
          }

          const targetLang = deeplLangMap[lang] || lang.toUpperCase()
          const params = new URLSearchParams({
            text: block.text,
            target_lang: targetLang,
          })

          const res = await fetch("https://api-free.deepl.com/v2/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `DeepL-Auth-Key ${apiKey}`,
            },
            body: params,
          })
          
          const data = await res.json()
          const translatedText = data.translations?.[0]?.text || block.text
          
          translatedBlocks.push({
            index: block.index,
            time: block.time,
            text: translatedText
          })
        }
        
        results[lang] = buildSRT(translatedBlocks)
      }
    }

    // 단일 언어면 직접 파일 반환, 다중 언어면 ZIP
    if (targetLanguages.length === 1) {
      const lang = targetLanguages[0]
      const filename = `${file.name.replace(/\.[^/.]+$/, "")}_${lang}.srt`
      
      return new NextResponse(results[lang], {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // 다중 언어 - ZIP 생성
      const zip = new JSZip()
      
      for (const lang of targetLanguages) {
        const filename = `${file.name.replace(/\.[^/.]+$/, "")}_${lang}.srt`
        zip.file(filename, results[lang])
      }
      
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="translated-subs.zip"`
        }
      })
    }

  } catch (error) {
    console.error('파일 번역 중 오류:', error)
    return NextResponse.json({ success: false, error: '파일 번역 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 