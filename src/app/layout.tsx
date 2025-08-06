import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'
import SettingsModal from '../components/SettingsModal'
import { AuthProvider } from '../contexts/AuthContext'
import GoogleAnalytics from '../components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'eztran.ai',
  description: '무료 AI 번역 서비스',
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
      <head>
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7286979091056475"
     crossOrigin="anonymous"></script>
        

      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <SettingsModal />
            <GoogleAnalytics />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
