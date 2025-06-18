import { redirect } from 'next/navigation';

// 루트(/) 접근 시 /translate-task로 리다이렉트
export default function Home() {
  redirect('/translate-task');
  return null;
}
