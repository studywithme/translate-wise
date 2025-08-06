export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보 처리방침</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 개인정보 수집 및 이용 목적</h2>
              <p className="mb-4">
                본 웹사이트는 번역 서비스 제공을 위해 다음과 같은 개인정보를 수집하고 있습니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>번역 요청 텍스트 (서비스 제공 목적으로만 사용)</li>
                <li>브라우저 언어 설정 (번역 언어 자동 감지)</li>
                <li>쿠키 정보 (광고 개인화 및 서비스 개선)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 광고 관련 개인정보 처리</h2>
              <p className="mb-4">
                본 웹사이트는 Google AdSense를 통해 광고를 제공합니다. 광고 개인화를 위해 다음과 같은 정보가 처리됩니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP 주소 (광고 타겟팅)</li>
                <li>브라우저 정보 (광고 호환성 확인)</li>
                <li>방문 페이지 정보 (광고 성과 측정)</li>
                <li>쿠키 정보 (광고 선호도 기억)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 쿠키 사용</h2>
              <p className="mb-4">
                본 웹사이트는 다음과 같은 목적으로 쿠키를 사용합니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>번역 언어 설정 기억</li>
                <li>광고 개인화 및 성과 측정</li>
                <li>서비스 사용 통계 수집</li>
                <li>사용자 경험 개선</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 개인정보 보호</h2>
              <p className="mb-4">
                수집된 개인정보는 다음과 같이 보호됩니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>암호화된 통신으로 안전한 전송</li>
                <li>최소한의 정보만 수집 및 보관</li>
                <li>서비스 목적 외 사용 금지</li>
                <li>정기적인 보안 점검</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 사용자 권리</h2>
              <p className="mb-4">
                사용자는 다음과 같은 권리를 가집니다:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>개인정보 수집 및 이용에 대한 동의 철회</li>
                <li>개인정보 삭제 요청</li>
                <li>광고 개인화 설정 변경</li>
                <li>쿠키 삭제 및 차단</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 문의처</h2>
              <p>
                개인정보 처리에 관한 문의사항이 있으시면 다음 연락처로 문의해 주세요:
              </p>
              <p className="mt-2 text-blue-600">
                이메일: privacy@eztran.ai
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 개정사항</h2>
              <p>
                본 개인정보 처리방침은 2024년 1월 1일부터 적용되며, 
                개인정보 처리방침이 변경될 경우 웹사이트를 통해 공지합니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 