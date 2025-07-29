"use client";

import React, { useState } from "react";
import { useSettings } from "../../../contexts/SettingsContext";

export default function HtmlTranslatePage() {
  const { settings } = useSettings();
  const [htmlSource, setHtmlSource] = useState("<p>여기에 번역할 HTML 컨텐츠를 입력하세요.</p>");
  const [resultHtml, setResultHtml] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("en");
  const [activeTab, setActiveTab] = useState<'source' | 'preview'>("source");
  const [isFocused, setIsFocused] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleTranslate = async () => {
    setIsTranslating(true);
    setResultHtml("");
    try {
      const response = await fetch("/api/deepl-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: htmlSource,
          targetLanguages: [targetLang],
          tag_handling: "html",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setResultHtml(data.result?.[targetLang] || "");
      } else {
        setResultHtml("번역 실패");
      }
    } catch (e) {
      setResultHtml("번역 중 오류 발생");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">HTML 태그 번역</h1>
      <div className="grid grid-cols-2 gap-8">
        {/* 입력 영역 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6 flex flex-col">
          <div className="mb-4 flex gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${activeTab === 'source' ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('source')}
            >HTML 소스 입력</button>
            <button
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('preview')}
            >미리보기</button>
          </div>
          <div className="flex-1 w-full">
            {activeTab === 'source' ? (
              <textarea
                value={htmlSource}
                onChange={e => setHtmlSource(e.target.value)}
                className="w-full h-[350px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 font-mono text-sm resize-vertical"
                onFocus={() => {
                  if (htmlSource === "<p>여기에 번역할 HTML 컨텐츠를 입력하세요.</p>") {
                    setHtmlSource("");
                  }
                }}
                onBlur={() => {
                  if (htmlSource.trim() === "") {
                    setHtmlSource("<p>여기에 번역할 HTML 컨텐츠를 입력하세요.</p>");
                  }
                }}
              />
            ) : (
              <div className="w-full min-h-[350px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white p-4 prose max-w-none" style={{ background: '#fff' }} dangerouslySetInnerHTML={{ __html: htmlSource }} />
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label className="font-semibold text-gray-700 dark:text-gray-100">타겟 언어</label>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-200"
            >
              <option value="en">영어</option>
              <option value="ja">일본어</option>
              <option value="zh">중국어</option>
              <option value="fr">프랑스어</option>
              <option value="de">독일어</option>
            </select>
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 dark:bg-blue-800 dark:hover:bg-blue-900 dark:disabled:bg-gray-700"
            >
              ▶ {isTranslating ? "번역 중..." : "번역하기"}
            </button>
          </div>
        </div>
        {/* 번역 결과 미리보기 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-6 flex flex-col">
          <label className="font-semibold text-gray-700 dark:text-gray-100 mb-2">번역 결과 (HTML 유지)</label>
          <div className="flex justify-end mb-2">
            <button
              onClick={async () => {
                if (resultHtml) {
                  await navigator.clipboard.writeText(resultHtml);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 1500);
                }
              }}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors disabled:opacity-50"
              disabled={!resultHtml}
            >
              복사하기
            </button>
            {copySuccess && (
              <span className="ml-2 text-green-600 dark:text-green-400 text-sm">복사됨!</span>
            )}
          </div>
          <div className="flex-1 min-h-[350px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white p-4" style={{ background: '#fff' }}>
            {resultHtml ? (
              <div dangerouslySetInnerHTML={{ __html: resultHtml }} className="prose max-w-none" style={{ background: '#fff' }} />
            ) : (
              <p className="text-gray-400 dark:text-gray-500">번역 결과가 여기에 표시됩니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 