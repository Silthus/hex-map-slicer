import type { Metadata } from 'next'
import { Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { AppProvider } from '@/contexts/AppContext'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hex Grid Tiler',
  description: 'Create printable hex map tiles with smart overlap for tabletop gaming',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-topographic">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
