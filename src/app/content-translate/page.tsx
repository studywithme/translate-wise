"use client";

import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export default function ContentTranslatePage() {
  const { settings, setIsSettingsOpen } = useSettings();
  const [sourceText, setSourceText] = useState('');
  const [translatedTexts, setTranslatedTexts] = useState<{[key: string]: string}>({});
  const [sourceLang, setSourceLang] = useState(settings.sourceLanguages[0]?.code || 'ko');
  const [activeTab, setActiveTab] = useState(settings.targetLanguages[0]?.code || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [validateSourceLang, setValidateSourceLang] = useState(sourceLang); // 검증용 원본 언어
  const [validationResult, setValidationResult] = useState(''); // 검증 결과

  // 번역 함수: 현재 탭 언어만 번역
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      // 이미 번역된 경우 재요청하지 않음
      if (translatedTexts[activeTab]) {
        setIsTranslating(false);
        return;
      }
      // 한글 주석: gemini-translate API로 현재 탭 언어만 번역
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
    setIsTranslating(true);
    setValidationResult('');
    try {
      // 한글 주석: 타깃 언어 번역 결과를 validateSourceLang(원본 언어)로 다시 번역
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
      setIsTranslating(false);
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
                  // 한글 주석: 원본 언어를 선택하면 검증 언어(activeTab)도 같이 변경
                  setSourceLang(e.target.value);
                  setActiveTab(e.target.value);
                }}
                className="w-full bg-transparent text-gray-700 font-medium focus:outline-none dark:text-gray-200"
              >
                {settings.sourceLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name} ▼</option>
                ))}
              </select>
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900 dark:border-blue-700">
                  <h3 className="font-medium text-blue-800 mb-2 dark:text-blue-200">{settings.targetLanguages.find(l => l.code === activeTab)?.name} 번역:</h3>
                  <p className="text-gray-700 leading-relaxed dark:text-gray-100">{translatedTexts[activeTab]}</p>
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
              disabled={!translatedTexts[activeTab] || isTranslating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 dark:bg-green-800 dark:hover:bg-green-900 dark:disabled:bg-gray-700"
            >
              ▶ 검증하기
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