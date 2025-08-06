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

  // Google AdSense 테스트 광고 ID들 (공식)
  const testAdUnitIds = {
    horizontalBanner: 'ca-app-pub-3940256099942544/6300978111', // 테스트 배너 (728x90)
    verticalSidebar: 'ca-app-pub-3940256099942544/6300978111', // 테스트 배너 (160x600)
  };

  // 실제 디스플레이 광고 단위 ID들
  const productionAdUnitIds = {
    // 수평형 광고 (가로형)
    horizontalBanner: 'ca-app-pub-7286979091056475/9649584642', // 하단 수평 배너
    
    // 수직형 광고 (세로형)
    verticalSidebar: 'ca-app-pub-7286979091056475/1439922138', // 오른쪽 사이드바 수직 배너
  };

  const getAdUnitId = () => {
    return testAdUnitIds[adSize as keyof typeof testAdUnitIds] || testAdUnitIds.horizontalBanner;
  };

  const getAdSize = () => {
    switch (adSize) {
      // 수평형 광고 (가로형)
      case 'horizontalBanner':
        return { width: 728, height: 90 }; // 표준 수평 배너
      
      // 수직형 광고 (세로형)
      case 'verticalSidebar':
        return { width: 160, height: 600 }; // 사이드바 수직 배너
      
      default:
        return { width: 728, height: 90 }; // 기본값
    }
  };

  const adSizeStyle = getAdSize();

  // 로컬호스트 확인 (클라이언트에서만)
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setIsClient(true);
    
    // 로컬호스트 확인
    const checkLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsLocalhost(checkLocalhost);
    
    if (checkLocalhost) {
      // 로컬호스트에서는 실제 테스트 광고 로드
      const loadTestAd = async () => {
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setTimeout(() => {
              setIsAdLoaded(true);
            }, 2000);
          } catch (error) {
            console.log('테스트 광고 로드 중 오류:', error);
            // 오류 시에도 시뮬레이션 표시
            setTimeout(() => {
              setIsAdLoaded(true);
            }, 3000);
          }
        } else {
          // adsbygoogle이 없으면 시뮬레이션
          setTimeout(() => {
            setIsAdLoaded(true);
          }, 3000);
        }
      };

      loadTestAd();
    } else {
      // 실제 서버에서는 실제 광고 로드
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
      
      {/* 실제 Google AdSense 광고 */}
      {isClient && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-7286979091056475"
          data-ad-slot={isLocalhost ? "6300978111" : adUnitId.split('/')[1]}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export default AdMobBanner; 