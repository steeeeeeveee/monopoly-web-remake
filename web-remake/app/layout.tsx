import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://dafuweng-steve.steve2329362568.chatgpt.site'),
  title: '大富翁网页版',
  description: '支持电脑和手机浏览器的多人同屏与人机对战大富翁游戏。',
  openGraph: {
    title: '大富翁网页版',
    description: '支持电脑和手机浏览器的多人同屏与人机对战大富翁游戏。',
    type: 'website',
    locale: 'zh_CN',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: '大富翁网页版',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '大富翁网页版',
    description: '支持电脑和手机浏览器的多人同屏与人机对战大富翁游戏。',
    images: ['/og.png'],
  },
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
