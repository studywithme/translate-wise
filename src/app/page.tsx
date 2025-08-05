"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { franc } from 'franc';
import { ClipboardDocumentIcon, Cog6ToothIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import SettingsModal from '@/components/SettingsModal';
import { useSettings } from '@/contexts/SettingsContext';
import AdMobBanner from '@/components/AdMobBanner';

// 지원 언어 목록
const LANGUAGES = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "영어" },
  { code: "ja", name: "일본어" },
  { code: "zh", name: "중국어" },
  { code: "es", name: "스페인어" },
  { code: "fr", name: "프랑스어" },
  { code: "de", name: "독일어" },
  { code: "it", name: "이탈리아어" },
  { code: "ru", name: "러시아어" },
  { code: "pt", name: "포르투갈어" },
  { code: "auto", name: "자동인식" }
];

// 번역 엔진 목록
const TRANSLATION_ENGINES = [
  { code: "deepl", label: "DeepL" },
  { code: "gemini", label: "Gemini" },
  { code: "gpt", label: "ChatGPT" },
];

export default function B2CHome() {
  const { settings, setIsSettingsOpen } = useSettings();
  
  // 상태 관리
  const [sourceText, setSourceText] = useState('');
  const [translatedTexts, setTranslatedTexts] = useState<{[key: string]: string}>({});
  const [sourceLang, setSourceLang] = useState(settings.sourceLanguages[0]?.code || 'ko');
  const [activeTab, setActiveTab] = useState(settings.targetLanguages[0]?.code || 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('deepl');

  // franc(ISO 639-3) → 639-1 매핑
  const iso3to1Map: Record<string, string> = { kor: 'ko', eng: 'en', jpn: 'ja', cmn: 'zh', spa: 'es', fra: 'fr', deu: 'de', ita: 'it', rus: 'ru', por: 'pt' };
  
  // 감지된 언어 표시 로직 개선
  const shouldShowDetectedLang = useMemo(() => {
    return detectedLang && detectedLang !== 'und' && detectedLang !== 'un';
  }, [detectedLang]);
  
  const detectedLang1 = useMemo(() => {
    if (!shouldShowDetectedLang) return '';
    return iso3to1Map[detectedLang] || detectedLang;
  }, [detectedLang, shouldShowDetectedLang]);

  const langNameMap: Record<string, string> = {
    ko: '한국어', en: '영어', ja: '일본어', zh: '중국어', es: '스페인어', fr: '프랑스어', de: '독일어', it: '이탈리아어', ru: '러시아어', pt: '포르투갈어', auto: '자동인식'
  };

  // 원본 언어 자동인식 기능
  useEffect(() => {
    if (sourceText.trim().length > 0) {
      const code = franc(sourceText);
      setDetectedLang(code);
      const mapped = iso3to1Map[code] || code;
      setSourceLang('auto');
    }
  }, [sourceText]);

  // 번역 함수
  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setIsValidating(false);
    try {
      const response = await fetch('/api/proxy-translate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: sourceText,
          targetLanguages: [activeTab],
          model: selectedEngine,
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

  // 탭 클릭 시 해당 언어로 번역
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
          model: selectedEngine,
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

  // 검증하기 함수
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
          targetLanguages: [sourceLang === 'auto' ? detectedLang1 : sourceLang],
          model: selectedEngine,
          options: {
            preserve_formatting: true
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const targetLang = sourceLang === 'auto' ? detectedLang1 : sourceLang;
          setValidationResult(data.data.translations[targetLang] || '검증 번역 실패');
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
  const handleCopyResult = async () => {
    if (translatedTexts[activeTab]) {
      try {
        // Clipboard API가 지원되는 경우
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(translatedTexts[activeTab]);
        } else {
          // fallback: 임시 textarea 사용
          const textArea = document.createElement('textarea');
          textArea.value = translatedTexts[activeTab];
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        // 복사 성공 피드백 (선택사항)
        console.log('번역 결과가 클립보드에 복사되었습니다.');
      } catch (error) {
        console.error('복사 실패:', error);
      }
    }
  };

  // 개선 제안함 이동 함수
  const handleFeedbackClick = () => {
    // 개선 제안함 페이지로 이동 (임시로 새 탭에서 열기)
    window.open('/board', '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* 헤더 섹션 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">eztran.ai</h1>
            <span className="text-sm text-gray-500">번역 서비스</span>
          </div>
          <div className="flex items-center gap-3">
            {/* 언어 설정 버튼 */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="언어 설정"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="text-sm font-medium">언어 설정</span>
            </button>
            
            {/* 개선 제안함 버튼 */}
            <button
              onClick={handleFeedbackClick}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="개선 제안함"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span className="text-sm font-medium">개선 제안함</span>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1">
        {/* 중앙 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col">

          {/* 기존 3단 레이아웃 */}
          <div className="flex flex-1">
            {/* 1. 원본 입력 영역 */}
            <div className="flex-1 flex flex-col p-6 border-r border-gray-200">
              <div className="mb-4">
                <div className="mb-2">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">원본언어:</label>
                      <select 
                        value={sourceLang} 
                        onChange={(e) => {
                          setSourceLang(e.target.value);
                          const nextTab = settings.targetLanguages.find(lang => lang.code !== (e.target.value === 'auto' ? detectedLang1 : e.target.value));
                          if (nextTab) setActiveTab(nextTab.code);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        {settings.sourceLanguages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">번역엔진:</label>
                      <select 
                        value={selectedEngine}
                        onChange={(e) => setSelectedEngine(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      >
                        {TRANSLATION_ENGINES.map(engine => (
                          <option key={engine.code} value={engine.code}>
                            {engine.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="h-8 flex items-center">
                    {shouldShowDetectedLang && (
                      <div className="text-sm text-blue-600 font-semibold">
                        감지된 언어: {langNameMap[detectedLang1] || detectedLang1}
                      </div>
                    )}
                    {/* 언어 감지 중일 때 표시 */}
                    {sourceText.trim().length > 0 && !shouldShowDetectedLang && (
                      <div className="text-sm text-gray-500">언어 감지 중...</div>
                    )}
                  </div>
                </div>
              </div>
              
                                      <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="번역할 텍스트를 입력하세요..."
                className="h-96 w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
              
              {/* 번역 대상 언어 선택 */}
              <div className="mt-4 mb-2">
                <label className="block font-semibold text-gray-700 mb-2">번역 대상 언어</label>
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
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : isDisabled
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-100'
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
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                ▶ {isTranslating ? '번역 중...' : '번역하기'}
              </button>
            </div>

            {/* 2. 번역 결과 영역 */}
            <div className="flex-1 flex flex-col p-6 border-r border-gray-200">
              <div className="mb-4">
                <div className="mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    번역 결과 ({langNameMap[activeTab] || activeTab})
                  </h2>
                  <div className="h-8 flex items-center">
                    {/* 번역 결과 영역의 여백을 맞추기 위한 빈 공간 */}
                  </div>
                </div>
              </div>
              
                        <div className="h-96 overflow-y-auto mb-4 border border-gray-300 rounded-lg p-4 bg-white">
            {translatedTexts[activeTab] ? (
              <div className="flex flex-col h-full">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line flex-1">{translatedTexts[activeTab]}</p>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCopyResult}
                    className="p-1 bg-white rounded-full border border-gray-300 hover:bg-blue-100 transition"
                    title="복사"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">번역 결과가 여기에 표시됩니다.</p>
            )}
          </div>
              
              {/* 검증하기 버튼을 번역 결과 영역으로 이동 */}
              <div className="mt-20">
                <button
                  onClick={handleValidate}
                  disabled={!translatedTexts[activeTab] || isValidating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:text-gray-200 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  ▶ {isValidating ? '검증 중...' : '원문 언어로 다시 번역하기'}
                </button>
              </div>
            </div>

            {/* 3. 검증 결과 영역 */}
            <div className="flex-1 flex flex-col p-6">
              <div className="mb-4">
                <div className="mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">검증 결과</h2>
                  <div className="h-8 flex items-center">
                    {/* 검증 결과 영역의 여백을 맞추기 위한 빈 공간 */}
                  </div>
                </div>
              </div>
              
                        <div className="h-96 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-4">
            {validationResult ? (
              <p className="text-blue-700 whitespace-pre-line">{validationResult}</p>
            ) : (
              <p className="text-gray-400">검증 결과가 여기에 표시됩니다.</p>
            )}
          </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 광고 (데스크톱에서만 표시) */}
        <div className="hidden lg:flex w-40 flex-shrink-0 flex justify-center items-start pt-6">
          <AdMobBanner 
            adUnitId="ca-app-pub-3940256099942544/6300978111"
            adSize="skyscraper"
            className="w-160px"
          />
        </div>
      </div>
      
      {/* 하단 광고 */}
      <div className="mt-8 flex justify-center">
        <AdMobBanner 
          adUnitId="ca-app-pub-7286979091056475/6300978111"
          adSize="largeBanner"
          className="w-full max-w-728px"
        />
      </div>
      
      {/* 언어 설정 모달 */}
      <SettingsModal />
    </div>
  );
}
