"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
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
  // 감지된 언어 표시 로직 개선
  const shouldShowDetectedLang = useMemo(() => {
    return detectedLang && detectedLang !== 'und' && detectedLang !== 'un';
  }, [detectedLang]);

  // 감지된 언어의 639-1 코드 (und 제외)
  const detectedLang1 = useMemo(() => {
    if (!shouldShowDetectedLang) return '';
    return iso3to1Map[detectedLang] || detectedLang;
  }, [detectedLang, shouldShowDetectedLang]);

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
      const response = await fetch('/api/proxy-translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: sourceText,
          targetLanguages: [activeTab],
          model: 'deepl',
          options: {
            preserve_formatting: true
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTranslatedTexts(prev => ({ 
            ...prev, 
            [activeTab]: data.data.translations[activeTab] 
          }));
        } else {
          console.error('번역 실패:', data.error);
        }
      } else {
        console.error('번역 요청 실패');
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
      const response = await fetch('/api/proxy-translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: sourceText,
          targetLanguages: [langCode],
          model: 'deepl',
          options: {
            preserve_formatting: true
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTranslatedTexts(prev => ({ 
            ...prev, 
            [langCode]: data.data.translations[langCode] 
          }));
        } else {
          console.error('번역 실패:', data.error);
        }
      } else {
        console.error('번역 요청 실패');
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
      const response = await fetch('/api/proxy-translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: translatedTexts[activeTab],
          targetLanguages: [validateSourceLang],
          model: 'deepl',
          options: {
            preserve_formatting: true
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setValidationResult(data.data.translations[validateSourceLang] || '검증 번역 실패');
        } else {
          setValidationResult('검증 번역 실패: ' + data.error.message);
        }
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
      {/* 3단 레이아웃: 원본 입력 | 번역 결과 | 검증 결과 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* 1. 원본 입력 영역 */}
        <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 p-4">
          <div className="mb-2">
            <label className="block font-semibold text-gray-700 dark:text-gray-100 mb-1">원본 언어</label>
            <select 
              value={sourceLang} 
              onChange={(e) => {
                setSourceLang(e.target.value);
                // 원본 언어와 다른 첫 번째 타겟 언어로 activeTab 설정
                const nextTab = settings.targetLanguages.find(lang => lang.code !== (e.target.value === 'auto' ? detectedLang1 : e.target.value));
                if (nextTab) setActiveTab(nextTab.code);
              }}
              className="w-full bg-transparent text-gray-700 font-medium focus:outline-none dark:text-gray-200"
            >
              {settings.sourceLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} ▼</option>
              ))}
            </select>
            {/* 한글 주석: 자동인식 시 감지된 언어를 한글로 안내 (폰트 크게) */}
            {settings.sourceLanguages.some(lang => lang.code === 'auto') && shouldShowDetectedLang && (
              <>
                <div className="mt-1 text-lg text-blue-600 dark:text-blue-300 font-semibold">감지된 언어: {langNameMap[detectedLang1] || detectedLang1}</div>
                {sourceText.length < 15 && (
                  <div className="text-xs text-blue-500 mt-1">※ 입력이 짧으면 언어 감지 정확도가 낮아질 수 있습니다.</div>
                )}
              </>
            )}
            {/* 언어 감지 중일 때 표시 */}
            {settings.sourceLanguages.some(lang => lang.code === 'auto') && sourceText.trim().length > 0 && !shouldShowDetectedLang && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">언어 감지 중...</div>
            )}
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="번역할 텍스트를 입력하세요..."
            className="flex-1 w-full p-4 resize-none border-none focus:outline-none text-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg"
          />
          
          {/* 번역 대상 언어 선택 */}
          <div className="mt-4 mb-2">
            <label className="block font-semibold text-gray-700 dark:text-gray-100 mb-2">번역 대상 언어</label>
            <div className="flex gap-1 flex-wrap">
              {settings.targetLanguages.map(lang => {
                const isDisabled = lang.code === (sourceLang === 'auto' ? detectedLang1 : sourceLang);
                return (
                  <button
                    key={lang.code}
                    onClick={() => !isDisabled && setActiveTab(lang.code)}
                    disabled={isDisabled}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeTab === lang.code
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
                        : isDisabled
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 dark:bg-blue-800 dark:hover:bg-blue-900 dark:disabled:bg-gray-700"
          >
            ▶ {isTranslating ? '번역 중...' : '번역하기'}
          </button>
        </div>
        {/* 2. 번역 결과 영역 */}
        <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 p-4">
          <div className="mb-2">
            <label className="block font-semibold text-gray-700 dark:text-gray-100 mb-1">
              번역 결과 ({langNameMap[activeTab] || activeTab})
            </label>
          </div>
          <div className="relative flex-1 overflow-y-auto">
            {translatedTexts[activeTab] ? (
              <div className="flex flex-col h-full">
                <p className="text-gray-700 leading-relaxed dark:text-gray-100 whitespace-pre-line flex-1">{translatedTexts[activeTab]}</p>
                {/* 복사 아이콘 버튼을 하단에 배치 */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCopyResult}
                    className="p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-700 transition"
                    title="복사"
                  >
                    <ClipboardIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500">번역 결과가 여기에 표시됩니다.</p>
            )}
          </div>
        </div>
        {/* 3. 검증 결과 영역 */}
        <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 p-4">
          <div className="mb-2 flex gap-2 items-center">
            <label className="block font-semibold text-gray-700 dark:text-gray-100 mb-1">검증 결과</label>
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
              ▶ {isValidating ? '검증 중...' : '원문 언어로 다시 번역하기'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-2 min-h-[48px]">
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