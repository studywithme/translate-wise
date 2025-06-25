"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 언어 타입 정의
export interface Language {
  code: string;
  name: string;
}

// 설정 타입 정의
export interface Settings {
  sourceLanguages: Language[];
  targetLanguages: Language[];
}

// 컨텍스트 타입 정의
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

// 기본 언어 목록
const defaultLanguages: Language[] = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: '영어' },
  { code: 'ja', name: '일본어' },
  { code: 'zh', name: '중국어' },
  { code: 'es', name: '스페인어' },
  { code: 'fr', name: '프랑스어' },
  { code: 'de', name: '독일어' },
  { code: 'it', name: '이탈리아어' },
  { code: 'pt', name: '포르투갈어' },
  { code: 'ru', name: '러시아어' },
];

// 기본 설정
const defaultSettings: Settings = {
  sourceLanguages: [defaultLanguages[0]], // 한국어
  targetLanguages: [
    defaultLanguages[1], // 영어
    defaultLanguages[2], // 일본어
    defaultLanguages[3], // 중국어
  ],
};

// 컨텍스트 생성
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 설정 프로바이더 컴포넌트
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('translateWiseSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('설정 로드 중 오류:', error);
      }
    }
  }, []);

  // 설정 업데이트 함수
  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    // 로컬 스토리지에 저장
    localStorage.setItem('translateWiseSettings', JSON.stringify(newSettings));
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    isSettingsOpen,
    setIsSettingsOpen,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// 설정 컨텍스트 사용 훅
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings는 SettingsProvider 내에서 사용되어야 합니다');
  }
  return context;
}

// 전체 언어 목록 내보내기
export { defaultLanguages }; 