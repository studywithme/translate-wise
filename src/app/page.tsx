"use client";
import { useState } from "react";

// Step 3: mock 번역 API 함수 (실제 API 연동 전용)
function mockTranslateAPI(model: string, text: string, targets: string[]): Promise<Record<string, string>> {
  return new Promise(resolve => {
    setTimeout(() => {
      // 각 언어별로 mock 번역 결과 생성
      const result: Record<string, string> = {};
      targets.forEach(lang => {
        result[lang] = `[${model} 번역:${lang}] ` + text;
      });
      resolve(result);
    }, 1200); // 1.2초 후 응답
  });
}

// 실제 번역 API 호출 함수 (GPT-4o mini)
async function callGptTranslate(text: string, targets: string[]) {
  const res = await fetch("/api/gpt-translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguages: targets }),
  });
  const data = await res.json();
  console.log("GPT-4o 요청:", { text, targetLanguages: targets });
  console.log("GPT-4o 응답:", data);
  return data.result as Record<string, string>;
}

// 실제 번역 API 호출 함수 (Gemini 1.5 Flash)
async function callGeminiTranslate(text: string, targets: string[]) {
  const res = await fetch("/api/gemini-translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguages: targets }),
  });
  const data = await res.json();
  console.log("Gemini 요청:", { text, targetLanguages: targets });
  console.log("Gemini 응답:", data);
  return data.result as Record<string, string>;
}

// 지원하는 번역 모델 목록
const modelOptions = [
  { key: "gpt-4o", label: "GPT-4o mini (gpt-4o)" },
  { key: "gemini-1.5-flash", label: "Gemini 1.5 Flash (gemini-1.5-flash)" },
];

// Step 5: 언어별 토큰 계산 함수
function estimateTokensByLang(text: string, lang: string) {
  // 언어별 토큰 계산 방식
  // 한글, 일본어, 중국어: 한 글자당 2토큰
  // 영어: 4글자당 1토큰
  // 그 외: 4글자당 1토큰
  if (lang === "ko" || lang === "ja" || lang === "zh") {
    return text.length * 2;
  }
  if (lang === "en") {
    return Math.ceil(text.length / 4);
  }
  return Math.ceil(text.length / 4);
}

function estimateCost({
  modelKey,
  inputTokens,
  outputTokens,
}: {
  modelKey: string;
  inputTokens: number;
  outputTokens: number;
}) {
  // 1M 토큰 기준 단가
  const priceTable: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.15, output: 0.60 },
    "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  };
  const price = priceTable[modelKey];
  if (!price) return 0;
  return (
    (inputTokens * price.input + outputTokens * price.output) / 1_000_000
  );
}

export default function Home() {
  // 한국어 입력값을 저장할 상태
  const [koreanText, setKoreanText] = useState("");
  // Step 2: 타겟 언어 선택 상태
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["en", "ja"]);
  // Step 3: 번역 결과 상태
  const [gptResult, setGptResult] = useState<Record<string, string> | null>(null);
  const [geminiResult, setGeminiResult] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  // Step 3: 번역 모델 선택 상태 (기본값: 둘 다 선택)
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4o", "gemini-1.5-flash"]);

  // 지원하는 타겟 언어 목록
  const languageOptions = [
    { code: "en", label: "영어" },
    { code: "ja", label: "일본어" },
    { code: "zh", label: "중국어" },
    { code: "de", label: "독일어" },
    // 필요시 추가 가능
  ];

  // 멀티셀렉트 변경 핸들러 (언어)
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setTargetLanguages(selected);
  };

  // 멀티셀렉트 변경 핸들러 (모델)
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedModels(selected);
  };

  // Step 3: 번역 실행 핸들러
  const handleTranslate = async () => {
    setLoading(true);
    setGptResult(null);
    setGeminiResult(null);
    // 선택된 모델만 번역 실행
    const promises = [];
    if (selectedModels.includes("gpt-4o")) {
      promises.push(
        callGptTranslate(koreanText, targetLanguages).then(setGptResult)
      );
    }
    if (selectedModels.includes("gemini-1.5-flash")) {
      promises.push(
        callGeminiTranslate(koreanText, targetLanguages).then(setGeminiResult)
      );
    }
    await Promise.all(promises);
    setLoading(false);
  };

  // Step 5: 비용 추정 계산
  // 입력 토큰: 원본(한국어) 기준
  const inputTokens = koreanText ? estimateTokensByLang(koreanText, "ko") : 0;
  // 각 모델별 출력 토큰 합산 (언어별로 계산)
  const outputTokens: Record<string, number> = {
    "gpt-4o": 0,
    "gemini-1.5-flash": 0,
  };
  if (gptResult) {
    outputTokens["gpt-4o"] = targetLanguages.reduce((sum, lang) => {
      const txt = gptResult[lang] || "";
      sum += estimateTokensByLang(txt, lang);
      return sum;
    }, 0);
  }
  if (geminiResult) {
    outputTokens["gemini-1.5-flash"] = targetLanguages.reduce((sum, lang) => {
      const txt = geminiResult[lang] || "";
      sum += estimateTokensByLang(txt, lang);
      return sum;
    }, 0);
  }

  return (
    <div className="min-h-screen flex flex-col items-start bg-gray-50 dark:bg-gray-900 p-4">
      {/* Step 1: 한국어 텍스트 입력 카드 */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={!!koreanText} readOnly className="mr-2" />
          <h2 className="text-lg font-bold">Step 1: 한국어 텍스트 입력</h2>
        </div>
        <textarea
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none text-left"
          placeholder="번역할 한국어 문장을 입력하세요."
          value={koreanText}
          onChange={e => setKoreanText(e.target.value)}
        />
      </div>

      {/* Step 2: 타겟 언어 선택 카드 */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={targetLanguages.length > 0} readOnly className="mr-2" />
          <h2 className="text-lg font-bold">Step 2: 타겟 언어 선택</h2>
        </div>
        <label className="block mb-2 text-gray-700 dark:text-gray-200 text-left">번역할 언어를 선택하세요 (여러 개 선택 가능):</label>
        <select
          multiple
          className="w-full h-32 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-left"
          value={targetLanguages}
          onChange={handleLanguageChange}
        >
          {languageOptions.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      {/* Step 3: 번역 실행 카드 */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={
            (selectedModels.includes("gpt-4o") ? !!gptResult : true) &&
            (selectedModels.includes("gemini-1.5-flash") ? !!geminiResult : true)
          } readOnly className="mr-2" />
          <h2 className="text-lg font-bold">Step 3: AI 모델로 번역 실행</h2>
        </div>
        {/* 번역 모델 선택 멀티셀렉트 */}
        <label className="block mb-2 text-gray-700 dark:text-gray-200 text-left">번역에 사용할 모델을 선택하세요 (여러 개 선택 가능):</label>
        <select
          multiple
          className="w-full h-20 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 text-left"
          value={selectedModels}
          onChange={handleModelChange}
        >
          {modelOptions.map(model => (
            <option key={model.key} value={model.key}>{model.label}</option>
          ))}
        </select>
        <div className="flex justify-center">
          <button
            className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            onClick={handleTranslate}
            disabled={loading || !koreanText || targetLanguages.length === 0 || selectedModels.length === 0}
          >
            선택한 AI 모델로 번역 실행
          </button>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-blue-600 font-medium text-left">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            번역 중...
          </div>
        )}
      </div>

      {/* Step 4: 번역 결과 보기 카드 */}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={
            (selectedModels.includes("gpt-4o") ? !!gptResult : true) &&
            (selectedModels.includes("gemini-1.5-flash") ? !!geminiResult : true)
          } readOnly className="mr-2" />
          <h2 className="text-lg font-bold">Step 4: 번역 결과 보기</h2>
        </div>
        {/* 원본 텍스트 */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1 text-left">원본(한국어)</div>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100 text-sm text-left">
            {koreanText || <span className="text-gray-400">(입력 없음)</span>}
          </div>
        </div>
        {/* 2컬럼 번역 결과 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GPT-4o mini 결과 */}
          {selectedModels.includes("gpt-4o") && (
            <div>
              <div className="font-semibold mb-2 text-blue-700 dark:text-blue-300 text-left">GPT-4o mini (gpt-4o)</div>
              {gptResult ? (
                <ul className="space-y-2">
                  {targetLanguages.map(lang => (
                    <li key={lang} className="text-left">
                      <span className="inline-block w-16 font-mono text-xs text-gray-500">[{lang}]</span>
                      <span className="ml-2">{gptResult[lang]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400 text-sm text-left">번역 결과 없음</div>
              )}
            </div>
          )}
          {/* Gemini 1.5 Flash 결과 */}
          {selectedModels.includes("gemini-1.5-flash") && (
            <div>
              <div className="font-semibold mb-2 text-green-700 dark:text-green-300 text-left">Gemini 1.5 Flash (gemini-1.5-flash)</div>
              {geminiResult ? (
                <ul className="space-y-2">
                  {targetLanguages.map(lang => (
                    <li key={lang} className="text-left">
                      <span className="inline-block w-16 font-mono text-xs text-gray-500">[{lang}]</span>
                      <span className="ml-2">{geminiResult[lang]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400 text-sm text-left">번역 결과 없음</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 5: 비용 추정 카드 */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <input type="checkbox" checked={
            selectedModels.some(m => outputTokens[m] > 0)
          } readOnly className="mr-2" />
          <h2 className="text-lg font-bold">Step 5: 비용 추정</h2>
        </div>
        <table className="w-full text-sm text-left border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2 text-left">모델</th>
              <th className="p-2 text-left">입력 토큰</th>
              <th className="p-2 text-left">출력 토큰</th>
              <th className="p-2 text-left">예상 비용(USD)</th>
            </tr>
          </thead>
          <tbody>
            {selectedModels.map(modelKey => {
              const model = modelOptions.find(m => m.key === modelKey);
              return (
                <tr key={modelKey} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2 text-left">{model?.label}</td>
                  <td className="p-2 text-left">{inputTokens}</td>
                  <td className="p-2 text-left">{outputTokens[modelKey]}</td>
                  <td className="p-2 text-left">${estimateCost({ modelKey, inputTokens, outputTokens: outputTokens[modelKey] }).toFixed(6)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-xs text-gray-500 mt-2 text-left">
          * 한글은 한 글자당 약 2토큰, 영문 등은 4글자당 1토큰으로 근사 계산됩니다. 실제 비용과 다를 수 있습니다.
        </div>
      </div>
    </div>
  );
}
