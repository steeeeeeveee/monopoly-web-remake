import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '大富翁网页版',
  description: '支持电脑和手机浏览器的多人同屏与人机对战大富翁游戏。',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

