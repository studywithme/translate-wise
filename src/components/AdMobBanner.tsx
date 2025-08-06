import React, { useEffect, useRef, useState } from 'react';

interface AdMobBannerProps {
  adUnitId: string;
  adSize?: string;
  className?: string;
  style?: React.CSSProperties;
}

const AdMobBanner: React.FC<AdMobBannerProps> = ({ 
  adUnitId, 
  adSize = 'banner', 
  className = '', 
  style = {} 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // AdMob 테스트 광고 ID들
  const testAdUnitIds = {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Android
    largeBanner: 'ca-app-pub-3940256099942544/6300978111', // Android
    mediumRectangle: 'ca-app-pub-3940256099942544/6300978111', // Android
    skyscraper: 'ca-app-pub-3940256099942544/6300978111', // Android
  };

  // 실제 광고 ID로 교체할 때 사용
  const productionAdUnitIds = {
    banner: 'ca-app-pub-7286979091056475/6300978111', // 실제 광고 ID로 교체
    largeBanner: 'ca-app-pub-7286979091056475/6300978111',
    mediumRectangle: 'ca-app-pub-7286979091056475/6300978111',
    skyscraper: 'ca-app-pub-7286979091056475/6300978111',
  };

  const getAdUnitId = () => {
    return testAdUnitIds[adSize as keyof typeof testAdUnitIds] || testAdUnitIds.banner;
  };

  const getAdSize = () => {
    switch (adSize) {
      case 'largeBanner':
        return { width: 320, height: 100 };
      case 'mediumRectangle':
        return { width: 300, height: 250 };
      case 'skyscraper':
        return { width: 160, height: 600 };
      default:
        return { width: 320, height: 50 };
    }
  };

  const adSizeStyle = getAdSize();

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setIsClient(true);
    
    // 로컬호스트에서는 테스트 광고 시뮬레이션
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // 로컬호스트에서는 3초 후 광고 로드 시뮬레이션
      setTimeout(() => {
        setIsAdLoaded(true);
      }, 3000);
    } else {
      // 실제 AdMob SDK 로드
      const loadAdMob = async () => {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsAdLoaded(true);
          } catch (error) {
            console.log('AdMob 광고 로드 중 오류:', error);
          }
        }
      };

      loadAdMob();
    }
  }, []);

  // 서버 사이드 렌더링 중에는 로딩 상태 표시
  if (!isClient) {
    return (
      <div 
        className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={{ 
          width: `${adSizeStyle.width}px`, 
          height: `${adSizeStyle.height}px`,
          ...style 
        }}
      >
        <div className="text-center">
          <div className="text-gray-500 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={adRef}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={{ 
        width: `${adSizeStyle.width}px`, 
        height: `${adSizeStyle.height}px`,
        ...style 
      }}
    >
      {isAdLoaded ? (
        // 광고 로드 완료 시
        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-sm font-semibold mb-1">🎯 AdMob Test Ad</div>
            <div className="text-xs opacity-80">{adSizeStyle.width}x{adSizeStyle.height}</div>
            <div className="text-xs opacity-60 mt-1">Sponsored Content</div>
          </div>
        </div>
      ) : (
        // 광고 로딩 중
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-500 text-xs">Loading Ad...</div>
          </div>
        </div>
      )}
      
      {/* 실제 Google AdSense 광고 (로컬호스트가 아닐 때만) */}
      {isClient && !window.location.hostname.includes('localhost') && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-7286979091056475"
          data-ad-slot="6300978111"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export default AdMobBanner; 