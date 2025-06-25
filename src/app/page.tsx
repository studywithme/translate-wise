import { redirect } from 'next/navigation';

// 한글 주석: '/'로 접근 시 컨텐츠 번역 페이지로 리다이렉트
export default function Home() {
  redirect('/content-translate');
  return null;
}
