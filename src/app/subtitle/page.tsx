"use client";
import { useState, useRef } from "react";

// 지원 언어 목록
const LANGUAGES = [
  { code: "en", label: "영어" },
  { code: "ja", label: "일본어" },
  { code: "zh", label: "중국어" },
];

// SRT 파싱 및 재조립 유틸 (정확한 줄 구조 유지)
function parseSRT(srt: string) {
  return srt.split(/\n\n+/).map(block => {
    const lines = block.split("\n");
    return {
      index: lines[0],
      time: lines[1],
      // 여러 줄 텍스트도 배열로 저장
      text: lines.slice(2).join("\n"),
    };
  });
}
// SRT 구조를 정확히 재조립 (텍스트 내 줄바꿈도 반영)
function buildSRT(blocks: { index: string; time: string; text: string }[]) {
  return blocks.map(b => `${b.index}\n${b.time}\n${b.text}`.trim()).join("\n\n");
}

export default function SubtitlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLangs, setTargetLangs] = useState<string[]>(["en"]);
  const [downloadLinks, setDownloadLinks] = useState<{ lang: string; url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadLinks([]);
    }
  };

  // 드래그 앤 드랍 핸들러
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setDownloadLinks([]);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // 언어 선택 핸들러
  const handleLangChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setTargetLangs(prev =>
      checked ? [...prev, value] : prev.filter(l => l !== value)
    );
  };

  // 번역 실행 (translate-file API 연동)
  const handleTranslate = async () => {
    if (!file) return;
    setLoading(true);
    setDownloadLinks([]);

    // FormData 생성
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetLanguages", JSON.stringify(targetLangs));
    formData.append("model", "deepl"); // 필요시 모델 선택 UI 연동
    formData.append("fileType", "srt"); // 파일 형식 명시

    // 파일 번역 API 호출
    const res = await fetch("/api/v1/translate-file", {
      method: "POST",
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY as string
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('번역 실패:', error);
      alert(error.error?.message || '번역 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    // 여러 언어면 zip, 단일 언어면 SRT
    const contentDisposition = res.headers.get("Content-Disposition") || "";
    const isZip = res.headers.get("Content-Type")?.includes("zip");
    const blob = await res.blob();
    let links: { lang: string; url: string; name: string }[] = [];

    if (isZip) {
      // zip 파일이면 임시 다운로드 링크 1개만 제공
      const url = URL.createObjectURL(blob);
      links = [{ lang: "multi", url, name: "translated-subs.zip" }];
    } else {
      // 단일 언어 SRT 파일
      // 파일명 추출
      let fileName = "translated.srt";
      const match = contentDisposition.match(/filename=([^;]+)/);
      if (match) fileName = decodeURIComponent(match[1]);
      const url = URL.createObjectURL(blob);
      links = [{ lang: targetLangs[0], url, name: fileName }];
    }
    setDownloadLinks(links);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">영상 자막 파일 번역</h1>
      <div className="mb-4 text-gray-600">
        SRT, VTT 등 자막 파일을 업로드하여 다양한 언어로 번역할 수 있습니다.
      </div>
      {/* 파일 업로드 버튼 + 드래그 앤 드랍 */}
      <div className="mb-6">
        <label
          className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-gray-50 hover:border-blue-400'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".srt"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 mb-2"
              onClick={e => { e.preventDefault(); inputRef.current?.click(); }}
            >
              SRT 파일 선택
            </button>
            <span className="text-gray-500 text-sm">또는 파일을 이 영역에 드래그 앤 드랍하세요</span>
            {file && <span className="mt-2 text-blue-700 font-semibold">{file.name}</span>}
          </div>
        </label>
      </div>
      <div className="mb-6">
        <div className="mb-2 font-semibold">타겟 언어 선택</div>
        <div className="flex gap-4">
          {LANGUAGES.map(lang => (
            <label key={lang.code} className="flex items-center gap-1">
              <input
                type="checkbox"
                value={lang.code}
                checked={lang.code === 'en'}
                disabled={lang.code !== 'en'}
                readOnly
              />
              {lang.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">※ 현재는 영어만 번역 대상으로 선택할 수 있습니다.</p>
      </div>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleTranslate}
        disabled={!file || targetLangs.length === 0 || loading}
      >
        {loading ? "번역 중..." : "자막 번역 및 다운로드"}
      </button>
      {downloadLinks.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 font-semibold">번역된 자막 파일 다운로드</div>
          <ul className="space-y-2">
            {downloadLinks.map(link => (
              <li key={link.lang}>
                <a
                  href={link.url}
                  download={link.name}
                  className="text-blue-700 underline"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 