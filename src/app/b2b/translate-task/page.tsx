"use client";
import { useState } from "react";

// 지원 언어 목록
const LANGUAGES = [
  { code: "en", label: "영어" },
  { code: "ja", label: "일본어" },
  { code: "zh", label: "중국어" },
  { code: "de", label: "독일어" },
];

// 각 API별 최대 토큰 수 상수
const MAX_TOKENS = {
  gpt: 4096, // 예시: GPT-4o
  gemini: 8192, // 예시: Gemini 1.5 Flash
};

export default function TranslateTaskPage() {
  // 한글 입력 텍스트 상태
  const [inputText, setInputText] = useState("");
  // 타겟 언어 상태 (기본: 영어, 일본어)
  const [targetLangs, setTargetLangs] = useState<string[]>(["en", "ja"]);
  // 번역 결과 상태 (언어별)
  const [results, setResults] = useState<Record<string, string>>({});
  // Gemini 토큰 사용량 상태 (언어별)
  const [tokenUsage, setTokenUsage] = useState<Record<string, number>>({});
  // Gemini 전체 토큰 합계 계산
  const totalGeminiTokens = Object.values(tokenUsage).reduce((a, b) => a + b, 0);
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  // 에러 메시지 상태
  const [errorMsg, setErrorMsg] = useState("");
  // 교차 검증(재번역) 로딩 상태 (언어별)
  const [swapLoading, setSwapLoading] = useState<Record<string, boolean>>({});

  // 타겟 언어 멀티셀렉트 핸들러
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setTargetLangs(selected);
  };

  // 번역 실행 함수 (Gemini, GPT-4o 모두 최대 토큰 사용)
  const handleTranslate = async () => {
    setLoading(true);
    setResults({});
    setTokenUsage({});
    setErrorMsg("");
    try {
      const res = await fetch("/api/gemini-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, targetLanguages: targetLangs, max_tokens: MAX_TOKENS.gemini }),
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.finishReason === "MAX_TOKENS") {
        setErrorMsg("Gemini: 최대 토큰 수에 도달하여 번역이 중간에 잘렸습니다.");
      }
      setResults(data.result || {});
      setTokenUsage(data.tokenUsage || {});
    } catch (e) {
      setErrorMsg("번역 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 번역 결과 직접 수정 핸들러
  const handleResultEdit = (lang: string, value: string) => {
    setResults(prev => ({ ...prev, [lang]: value }));
  };

  // 카드 내 <=> 버튼 클릭 시 교차 검증 번역
  const handleSwapTranslate = async (lang: string) => {
    const targetText = results[lang] || "";
    setSwapLoading(prev => ({ ...prev, [lang]: true }));
    setErrorMsg("");
    try {
      // 프롬프트 없이 원문과 타겟 언어만 전달 (프롬프트는 백엔드에서 처리)
      const res = await fetch("/api/gemini-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetText, targetLanguages: ["ko"], max_tokens: MAX_TOKENS.gemini }),
      });
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.finishReason === "MAX_TOKENS") {
        setErrorMsg("Gemini: 최대 토큰 수에 도달하여 번역이 중간에 잘렸습니다.");
      }
      setResults(prev => ({ ...prev, [lang + "_back_ko"]: data.result?.["ko"] || "" }));
      setTokenUsage(prev => ({ ...prev, [lang + "_back_ko"]: data.tokenUsage?.["ko"] || 0 }));
    } catch (e) {
      setErrorMsg("번역 중 오류가 발생했습니다.");
    }
    setSwapLoading(prev => ({ ...prev, [lang]: false }));
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-gray-50 dark:bg-gray-900 p-0">
      {/* 상단 한글 입력 및 타겟 언어 선택 */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
        <div className="mb-4">
          <label className="block mb-2 font-semibold">한글 입력</label>
          <textarea
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none text-lg"
            placeholder="여기에 번역할 한글 텍스트를 입력하세요."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          {/* 입력 글자 수 및 토큰 수 표시 */}
          <div className="text-right text-sm text-gray-500 mt-1">
            총 {inputText.length}글자 입력됨
          </div>
          {/* API별 최대 토큰 안내 */}
          <div className="text-right text-xs text-gray-500 mt-1">
            GPT-4o 최대 토큰: {MAX_TOKENS.gpt} / Gemini 최대 토큰: {MAX_TOKENS.gemini}
          </div>
        </div>
        {/* 언어 선택과 번역 버튼을 한 줄에 배치, 체크박스 그룹으로 변경 */}
        <div className="flex flex-row items-end gap-4 mb-2">
          <div className="flex-1 max-w-xs">
            <label className="block mb-2 font-semibold">번역할 언어 선택</label>
            <div className="flex flex-row flex-wrap gap-4">
              {LANGUAGES.map(lang => (
                <label key={lang.code} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    value={lang.code}
                    checked={targetLangs.includes(lang.code)}
                    onChange={e => {
                      if (e.target.checked) {
                        setTargetLangs(prev => [...prev, lang.code]);
                      } else {
                        setTargetLangs(prev => prev.filter(l => l !== lang.code));
                      }
                    }}
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>
          <button
            className="px-10 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50 text-lg font-bold h-14"
            style={{ minWidth: '120px' }}
            onClick={handleTranslate}
            disabled={!inputText || targetLangs.length === 0 || loading}
          >
            {loading ? "번역 중..." : "번역하기"}
          </button>
          {/* 한글 주석: Gemini 사용 토큰 합계 표시 (깜빡임 없음) */}
          {totalGeminiTokens > 0 && (
            <div className="ml-4 px-4 py-2 rounded bg-yellow-200 text-red-700 font-bold text-base border border-yellow-400">
              사용 토큰 합계: {totalGeminiTokens} (요청+응답)
            </div>
          )}
        </div>
        {/* 에러 메시지 표시 */}
        {errorMsg && (
          <div className="mt-2 text-red-600 text-sm font-semibold">{errorMsg}</div>
        )}
      </div>
      {/* 하단: 번역 결과(타겟언어) -> 한글 교차 검증 카드 */}
      <div className="w-full max-w-6xl flex flex-col gap-6 px-4 mb-16">
        {targetLangs.map(lang => (
          <div key={lang} className="flex flex-row gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 items-stretch">
            {/* 왼쪽: 번역 결과(타겟 언어) */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 font-bold text-lg text-gray-700 dark:text-gray-200">{LANGUAGES.find(l => l.code === lang)?.label} 번역 결과</div>
              <textarea
                className="flex-1 w-full min-h-[6rem] p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg whitespace-pre-line resize-y"
                value={results[lang] || ""}
                onChange={e => handleResultEdit(lang, e.target.value)}
                placeholder="여기에 번역 결과가 표시됩니다."
              />
            </div>
            {/* 가운데: [언어 -> 한글] 버튼 */}
            <div className="flex flex-col justify-center items-center mx-2">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-sm mb-2 mt-2"
                onClick={() => handleSwapTranslate(lang)}
                title={`${LANGUAGES.find(l => l.code === lang)?.label} → 한글 재번역`}
                disabled={swapLoading[lang] || !results[lang]}
              >
                [{LANGUAGES.find(l => l.code === lang)?.label} → 한글]
              </button>
              {/* 한글 주석: 교차 검증 번역중 메시지 */}
              {swapLoading[lang] && (
                <div className="mt-1 text-blue-600 text-xs font-semibold">재번역 중...</div>
              )}
            </div>
            {/* 오른쪽: 교차 검증용 재번역 결과 */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 font-bold text-lg text-gray-700 dark:text-gray-200">{LANGUAGES.find(l => l.code === lang)?.label} → 한글</div>
              <div className="flex-1 w-full min-h-[6rem] p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-lg whitespace-pre-line">
                {/* 버튼 클릭 전에는 빈칸, 클릭 후에는 재번역 결과 */}
                {results[lang + "_back_ko"] || <span className="text-gray-400">여기에 {LANGUAGES.find(l => l.code === lang)?.label} → 한글 재번역 결과가 표시됩니다.</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 