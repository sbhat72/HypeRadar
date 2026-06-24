import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'HypeRadar — Track the Hype. Trade the Signal.',
  description:
    'Real-time stock market social sentiment analysis. See what Reddit and financial news are buzzing about before the move happens.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/hyped-stocks"
      signUpForceRedirectUrl="/hyped-stocks"
    >
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased" suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  )
}
