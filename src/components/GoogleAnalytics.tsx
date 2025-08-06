'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;

      // 동의 설정
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied'
      });

      // Google Analytics 초기화
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    }
  }, []);

  return null;
} 