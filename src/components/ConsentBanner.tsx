import React, { useEffect, useState } from 'react';

interface ConsentBannerProps {
  onConsentChange: (consent: boolean) => void;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({ onConsentChange }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // EEA, 영국, 스위스 사용자 확인
    const isEEAUser = () => {
      const userCountry = navigator.language || 'en';
      const eeaCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH'];
      return eeaCountries.some(country => userCountry.includes(country));
    };

    // 로컬 스토리지에서 동의 상태 확인
    const hasConsented = localStorage.getItem('adsense-consent');
    
    if (isEEAUser() && !hasConsented) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('adsense-consent', 'true');
    setShowBanner(false);
    onConsentChange(true);
  };

  const handleDecline = () => {
    localStorage.setItem('adsense-consent', 'false');
    setShowBanner(false);
    onConsentChange(false);
  };

  if (!isClient || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              개인정보 보호 및 광고 동의
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              이 웹사이트는 개인화된 광고를 제공하기 위해 쿠키를 사용합니다. 
              광고 수익은 사이트 운영에 도움이 됩니다. 
              <a href="/privacy" className="text-blue-600 hover:underline ml-1">
                개인정보 처리방침
              </a>을 확인하세요.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              거부
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              동의
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner; 