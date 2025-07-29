"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext';

// 상단 네비게이션 바 컴포넌트
export default function NavBar() {
  // 현재 경로를 가져옴 (클라이언트에서 안전하게 동작)
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // 메뉴 목록 (B2B 경로로 변경)
  const menuItems = [
    { name: '컨텐츠 번역', href: '/b2b/content-translate' },
    { name: '자막 번역', href: '/b2b/subtitle' },
    { name: 'HTML 번역', href: '/b2b/html-translate' },
    { name: '번역 작업', href: '/b2b/translate-task' },
    { name: '비용 견적', href: '/b2b/cost-estimate' },
  ];
  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center h-14 px-4 gap-4">
        <div className="font-bold text-lg text-blue-700">ezTran AI</div>
        <div className="flex gap-2 ml-6">
          {/* 메뉴 반복 렌더링, 현재 경로면 클릭된 것처럼 스타일 적용 */}
          {menuItems.map(menu => {
            const isActive = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`px-3 py-1 rounded transition text-sm font-medium
                  ${isActive
                    ? 'bg-blue-600 text-white shadow font-bold scale-105 pointer-events-none' // 클릭된 메뉴 스타일
                    : 'text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-800 hover:text-blue-700 active:scale-95'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {menu.name}
              </Link>
            );
          })}
        </div>
        <div className="flex-1" />
        {/* 로그인/로그아웃 영역 */}
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/auth/mypage" className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">마이페이지</Link>
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">로그인</Link>
            <Link href="/auth/register" className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300">회원가입</Link>
          </div>
        )}
      </div>
    </nav>
  )
} 