import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'
import SettingsModal from '../components/SettingsModal'
import { AuthProvider } from '../contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Translate Wise',
  description: 'AI 번역 비교 SaaS',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <SettingsModal />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
