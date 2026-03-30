import type { Metadata } from 'next'
import { Fraunces, Space_Grotesk } from 'next/font/google'
import { AppProviders } from '@/components/app-providers'
import './globals.css'

const displayFont = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
})

const bodyFont = Space_Grotesk({
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Krypstream',
  description: 'Private payroll and streaming payments on Fhenix CoFHE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
