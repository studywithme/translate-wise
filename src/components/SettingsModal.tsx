"use client";

import React, { useState, useEffect } from 'react';
import { useSettings, Language, defaultLanguages } from '../contexts/SettingsContext';

// 설정 모달 컴포넌트
export default function SettingsModal() {
  const { settings, updateSettings, isSettingsOpen, setIsSettingsOpen } = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);

  // 설정이 변경될 때마다 임시 설정 업데이트
  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // 모달 닫기
  const handleClose = () => {
    setIsSettingsOpen(false);
    setTempSettings(settings); // 취소 시 원래 설정으로 복원
  };

  // 설정 저장
  const handleSave = () => {
    updateSettings(tempSettings);
    setIsSettingsOpen(false);
  };

  // 언어 체크박스 토글
  const toggleLanguage = (language: Language, type: 'source' | 'target') => {
    const currentList = type === 'source' ? tempSettings.sourceLanguages : tempSettings.targetLanguages;
    const isSelected = currentList.some(lang => lang.code === language.code);
    
    let newList: Language[];
    if (isSelected) {
      // 최소 하나는 선택되어야 함
      if (currentList.length <= 1) return;
      newList = currentList.filter(lang => lang.code !== language.code);
    } else {
      newList = [...currentList, language];
    }
    
    setTempSettings(prev => ({
      ...prev,
      [type === 'source' ? 'sourceLanguages' : 'targetLanguages']: newList
    }));
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">번역 언어 설정</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-red-600 mt-2">
            설정된 언어가 탭으로 보이며 탭을 클릭하거나 [번역하기] 클릭하면 선택된 탭의 언어만 번역됨
          </p>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 원본 언어 설정 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">원본 언어 선택</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* 한글 주석: 자동인식 체크박스 추가 */}
              <label
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  tempSettings.sourceLanguages.some(lang => lang.code === 'auto')
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tempSettings.sourceLanguages.some(lang => lang.code === 'auto')}
                  onChange={e => {
                    let newList;
                    if (e.target.checked) {
                      newList = [...tempSettings.sourceLanguages, { code: 'auto', name: '자동인식' }];
                    } else {
                      newList = tempSettings.sourceLanguages.filter(lang => lang.code !== 'auto');
                    }
                    setTempSettings(prev => ({ ...prev, sourceLanguages: newList }));
                  }}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">자동인식</span>
              </label>
              {defaultLanguages.map(language => {
                // 한글 주석: 원본 언어도 여러 개 선택 가능(체크박스)
                const isSelected = tempSettings.sourceLanguages.some(lang => lang.code === language.code);
                return (
                  <label
                    key={language.code}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleLanguage(language, 'source')}
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{language.name}</span>
                  </label>
                );
              })}
            </div>
            {/* 한글 안내: 여러 개의 원본 언어를 선택할 수 있습니다. */}
            <p className="text-xs text-gray-500 mt-2">※ 여러 개의 원본 언어 또는 자동인식을 선택할 수 있습니다.</p>
          </div>

          {/* 번역 대상 언어 설정 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">번역 대상 언어 선택</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {defaultLanguages.map(language => {
                // 한글 주석: 여러 개 선택 가능(체크박스), 영어도 해제 가능
                const isSelected = tempSettings.targetLanguages.some(lang => lang.code === language.code);
                return (
                  <label
                    key={language.code}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        let newList;
                        if (isSelected) {
                          // 해제
                          newList = tempSettings.targetLanguages.filter(lang => lang.code !== language.code);
                        } else {
                          // 추가
                          newList = [...tempSettings.targetLanguages, language];
                        }
                        setTempSettings(prev => ({
                          ...prev,
                          targetLanguages: newList
                        }));
                      }}
                      className="mr-3 w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium">{language.name}</span>
                  </label>
                );
              })}
            </div>
            {/* 한글 안내: 여러 개의 번역 대상 언어를 선택할 수 있습니다. */}
            <p className="text-xs text-gray-500 mt-2">※ 여러 개의 번역 대상 언어를 선택할 수 있습니다.</p>
          </div>

          {/* 현재 설정 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">현재 설정 미리보기</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">원본 언어: </span>
                <span className="text-sm text-blue-600">
                  {tempSettings.sourceLanguages.map(lang => lang.name).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">번역 대상: </span>
                <span className="text-sm text-green-600">
                  {tempSettings.targetLanguages.map(lang => lang.name).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
} 