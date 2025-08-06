import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '../contexts/SettingsContext'
import SettingsModal from '../components/SettingsModal'
import { AuthProvider } from '../contexts/AuthContext'

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
        
        {/* Google Consent Management Platform */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied'
              });
            }
          `
        }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            }
          `
        }} />
      </head>
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
