"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { franc } from 'franc';
import { ClipboardIcon } from '@heroicons/react/24/outline';

export default function ContentTranslatePage() {
  const { settings, setIsSettingsOpen } = useSettings();
  const [sourceText, setSourceText] = useState('');
  const [translatedTexts, setTranslatedTexts] = useState<{[key: string]: string}>({});
  const [sourceLang, setSourceLang] = useState(settings.sourceLanguages[0]?.code || 'ko');
  const [activeTab, setActiveTab] = useState(settings.targetLanguages[0]?.code || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isValidating, setIsValidating] = useState(false); // 검증 중 상태
  const [validateSourceLang, setValidateSourceLang] = useState(sourceLang); // 검증용 원본 언어
  const [validationResult, setValidationResult] = useState(''); // 검증 결과
  const [detectedLang, setDetectedLang] = useState(''); // 감지된 언어 코드

  // franc(ISO 639-3) → 639-1 매핑
  const iso3to1Map: Record<string, string> = { kor: 'ko', eng: 'en', jpn: 'ja', cmn: 'zh', spa: 'es', fra: 'fr', deu: 'de', ita: 'it', rus: 'ru', por: 'pt' };
  // 감지된 언어의 639-1 코드
  const detectedLang1 = useMemo(() => iso3to1Map[detectedLang] || detectedLang, [detectedLang]);

  // 한글 주석: string 인덱스 시그니처 추가로 타입 에러 방지
  const langNameMap: Record<string, string> = {
    ko: '한국어', en: '영어', ja: '일본어', zh: '중국어', es: '스페인어', fr: '프랑스어', de: '독일어', it: '이탈리아어', ru: '러시아어', pt: '포르투갈어', auto: '자동인식'
  };

  // 한글 주석: 원본 언어 자동인식 기능
  useEffect(() => {
    if (settings.sourceLanguages.some(lang => lang.code === 'auto') && sourceText.trim().length > 0) {
      const code = franc(sourceText);
      setDetectedLang(code);
      const map: Record<string, string> = { kor: 'ko', eng: 'en', jpn: 'ja', cmn: 'zh', spa: 'es', fra: 'fr', deu: 'de', ita: 'it', rus: 'ru', por: 'pt' };
      const mapped = map[code] || code;
      setSourceLang('auto'); // 한글 주석: 드롭다운에서 자동인식이 선택되도록
    }
  }, [settings.sourceLanguages, sourceText]);

  // 번역 함수: 현재 탭 언어만 번역
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setIsValidating(false); // 번역 시작 시 검증 중 상태 해제
    try {
      if (translatedTexts[activeTab]) {
        setIsTranslating(false);
        return;
      }
      const response = await fetch('/api/gemini-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          targetLanguages: [activeTab],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTranslatedTexts(prev => ({ ...prev, ...data.result }));
      } else {
        console.error('번역 실패');
      }
    } catch (error) {
      console.error('번역 중 오류 발생:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 탭 클릭 시 해당 언어로 번역(아직 번역 안 된 경우만)
  const handleTabClick = async (langCode: string) => {
    setActiveTab(langCode);
    if (!sourceText.trim() || translatedTexts[langCode]) return;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/gemini-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          targetLanguages: [langCode],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTranslatedTexts(prev => ({ ...prev, ...data.result }));
      } else {
        console.error('번역 실패');
      }
    } catch (error) {
      console.error('번역 중 오류 발생:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // 검증하기 함수: 타깃 언어 번역 결과를 선택한 원본 언어로 다시 번역
  const handleValidate = async () => {
    if (!translatedTexts[activeTab]) return;
    setIsValidating(true);
    setValidationResult('');
    try {
      const response = await fetch('/api/gemini-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatedTexts[activeTab],
          targetLanguages: [validateSourceLang],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setValidationResult(data.result?.[validateSourceLang] || '검증 번역 실패');
      } else {
        setValidationResult('검증 번역 실패');
      }
    } catch (error) {
      setValidationResult('검증 중 오류 발생');
    } finally {
      setIsValidating(false);
    }
  };

  // 번역 결과 복사 함수
  const handleCopyResult = () => {
    if (translatedTexts[activeTab]) {
      navigator.clipboard.writeText(translatedTexts[activeTab]);
    }
  };

  // 톱니바퀴 클릭 핸들러
  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen dark:bg-gray-900">
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleSettingsClick}
            className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors dark:bg-blue-800 dark:hover:bg-blue-900"
          >
            <span className="text-white text-sm">⚙️</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">설정하기</h1>
        </div>
      </div>
      {/* 메인 번역 인터페이스 - 오른쪽에 검증 언어 박스 */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* 왼쪽 입력 영역 */}
        <div className="col-span-5">
          <div className="bg-white rounded-lg border border-gray-300 h-96 dark:bg-gray-800 dark:border-gray-700">
            {/* 언어 선택 */}
            <div className="border-b border-gray-200 p-3 dark:border-gray-700">
              <select 
                value={sourceLang} 
                onChange={(e) => {
                  setSourceLang(e.target.value);
                  setActiveTab(e.target.value);
                }}
                className="w-full bg-transparent text-gray-700 font-medium focus:outline-none dark:text-gray-200"
              >
                {settings.sourceLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name} ▼</option>
                ))}
              </select>
              {/* 한글 주석: 자동인식 시 감지된 언어를 한글로 안내 (폰트 크게) */}
              {settings.sourceLanguages.some(lang => lang.code === 'auto') && detectedLang && (
                <>
                  <div className="mt-1 text-lg text-blue-600 dark:text-blue-300 font-semibold">감지된 언어: {langNameMap[detectedLang1] || detectedLang1}</div>
                  {/* 한글 주석: 입력이 짧으면 감지 정확도 안내 */}
                  {sourceText.length < 15 && (
                    <div className="text-xs text-blue-500 mt-1">※ 입력이 짧으면 언어 감지 정확도가 낮아질 수 있습니다.</div>
                  )}
                </>
              )}
            </div>
            {/* 텍스트 입력 */}
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="번역할 텍스트를 입력하세요..."
              className="w-full h-72 p-4 resize-none border-none focus:outline-none text-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          {/* 번역하기 버튼 */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-blue-800 dark:hover:bg-blue-900 dark:disabled:bg-gray-700"
          >
            ▶ {isTranslating ? '번역 중...' : '번역하기'}
          </button>
        </div>
        {/* 오른쪽 번역 결과 + 검증 언어 박스 */}
        <div className="col-span-7 flex flex-col gap-4">
          {/* 기존 번역 결과 영역(탭) - 더 넓게 사용 */}
          <div className="bg-white rounded-lg border border-gray-300 flex-1 dark:bg-gray-800 dark:border-gray-700 p-4">
            <div className="border-b border-gray-200 pb-3 mb-3 dark:border-gray-700">
              <div className="flex gap-1 flex-wrap">
                {settings.targetLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleTabClick(lang.code)}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeTab === lang.code
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
            {/* 한글 주석: 탭처럼, 선택된 언어의 번역 결과만 보여줌 */}
            <div className="p-2 h-64 overflow-y-auto">
              {translatedTexts[activeTab] ? (
                <div className="relative p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900 dark:border-blue-700">
                  {/* 번역 결과만 표시, 언어명 제거 */}
                  <p className="text-gray-700 leading-relaxed dark:text-gray-100 whitespace-pre-line">{translatedTexts[activeTab]}</p>
                  {/* 복사 아이콘 버튼 */}
                  <button
                    onClick={handleCopyResult}
                    className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-700 transition"
                    title="복사"
                  >
                    <ClipboardIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">번역 결과가 여기에 표시됩니다.</p>
              )}
            </div>
          </div>
          {/* 검증하기 버튼과 검증 언어 박스: 번역 결과 아래, 중간에 버튼 */}
          <div className="flex items-center gap-4 mt-2">
            {/* 한글 주석: 검증용 원본 언어 선택 박스만 표시 */}
            <select
              value={validateSourceLang}
              onChange={e => setValidateSourceLang(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 font-medium focus:outline-none dark:text-gray-200"
            >
              {settings.sourceLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ▼</option>
              ))}
            </select>
            <button
              onClick={handleValidate}
              disabled={!translatedTexts[activeTab] || isValidating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 dark:bg-green-800 dark:hover:bg-green-900 dark:disabled:bg-gray-700"
            >
              ▶ {isValidating ? '검증 중...' : '검증하기'}
            </button>
          </div>
          {/* 한글 주석: 검증 결과 박스는 버튼 아래에 위치 */}
          <div className="bg-white rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 p-4 mt-2 min-h-[48px]">
            {validationResult ? (
              <p className="text-blue-700 dark:text-blue-200 whitespace-pre-line">{validationResult}</p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">검증 결과가 여기에 표시됩니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 