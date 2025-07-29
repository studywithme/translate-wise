import { redirect } from 'next/navigation';

// B2B 메인 페이지 - 기존 translate-task로 리다이렉트
export default function B2BHome() {
  redirect('/b2b/content-translate');
  return null;
} 