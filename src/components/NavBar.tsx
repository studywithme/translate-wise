"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 상단 네비게이션 바 컴포넌트
export default function NavBar() {
  // 현재 경로를 가져옴 (클라이언트에서 안전하게 동작)
  const pathname = usePathname();
  // 메뉴 목록
  const menus = [
    { name: '번역 업무', href: '/translate-task' },
    { name: '영상 자막 파일 번역', href: '/subtitle' },
    { name: '번역 비용 계산', href: '/cost-estimate' },
  ];
  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mb-6 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center h-14 px-4 gap-4">
        <div className="font-bold text-lg text-blue-700">ezTran AI</div>
        <div className="flex gap-2 ml-6">
          {/* 메뉴 반복 렌더링, 현재 경로면 클릭된 것처럼 스타일 적용 */}
          {menus.map(menu => {
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
      </div>
    </nav>
  )
} 