'use client'

import { useState, useEffect, useRef } from 'react'
import TrendingTickerCard, { type TickerData, type FlashEntry } from '@/components/dashboard/TrendingTickerCard'

const INITIAL_TICKERS: TickerData[] = [
  { symbol: 'GME',  price:  18.75, change:   2.10, changePercent:  12.60, mentions: 4821, hypeScore: 91 },
  { symbol: 'TSLA', price: 245.80, change:   3.24, changePercent:   1.34, mentions: 3642, hypeScore: 88 },
  { symbol: 'NVDA', price: 875.40, change: -12.50, changePercent:  -1.41, mentions: 3108, hypeScore: 82 },
  { symbol: 'AMC',  price:   4.32, change:   0.58, changePercent:  15.49, mentions: 2875, hypeScore: 85 },
  { symbol: 'AAPL', price: 192.50, change:  -1.80, changePercent:  -0.93, mentions: 2341, hypeScore: 65 },
  { symbol: 'META', price: 512.30, change:   8.40, changePercent:   1.67, mentions: 1982, hypeScore: 70 },
  { symbol: 'PLTR', price:  28.90, change:   1.45, changePercent:   5.28, mentions: 1742, hypeScore: 76 },
  { symbol: 'SOFI', price:   8.45, change:  -0.32, changePercent:  -3.65, mentions: 1482, hypeScore: 54 },
  { symbol: 'MSFT', price: 415.20, change:   2.75, changePercent:   0.67, mentions: 1284, hypeScore: 58 },
  { symbol: 'AMD',  price: 167.80, change:  -4.20, changePercent:  -2.44, mentions: 1156, hypeScore: 62 },
  { symbol: 'RIVN', price:  12.30, change:   0.85, changePercent:   7.42, mentions: 1043, hypeScore: 69 },
  { symbol: 'LCID', price:   3.18, change:  -0.12, changePercent:  -3.64, mentions:  921, hypeScore: 47 },
  { symbol: 'COIN', price: 228.40, change:  15.70, changePercent:   7.38, mentions:  874, hypeScore: 73 },
  { symbol: 'HOOD', price:  19.65, change:   0.90, changePercent:   4.80, mentions:  763, hypeScore: 52 },
  { symbol: 'SPCE', price:   1.84, change:  -0.08, changePercent:  -4.17, mentions:  642, hypeScore: 38 },
  { symbol: 'NIO',  price:   5.72, change:   0.34, changePercent:   6.32, mentions:  589, hypeScore: 44 },
  { symbol: 'SNOW', price: 145.30, change:  -3.40, changePercent:  -2.29, mentions:  478, hypeScore: 41 },
  { symbol: 'UBER', price:  76.90, change:   1.20, changePercent:   1.59, mentions:  412, hypeScore: 39 },
]

const TIME_TABS = ['1H', '1D', '1W', '1M'] as const
type TimeTab = typeof TIME_TABS[number]

export default function HypedStocksPage() {
  const [tickers, setTickers] = useState<TickerData[]>(INITIAL_TICKERS)
  const [activeTab, setActiveTab] = useState<TimeTab>('1D')
  const [flashState, setFlashState] = useState<Record<string, FlashEntry | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const maxMentions = Math.max(...tickers.map(t => t.mentions))

  useEffect(() => {
    const interval = setInterval(() => {
      const newFlashes: Record<string, FlashEntry> = {}
      const now = Date.now()

      setTickers(prev => prev.map(ticker => {
        // ~40% of tickers nudge per tick
        if (Math.random() > 0.6) return ticker

        const nudge = (Math.random() - 0.48) * ticker.price * 0.006
        const newPrice = Math.max(0.01, +(ticker.price + nudge).toFixed(2))
        const dir: 'up' | 'down' = nudge >= 0 ? 'up' : 'down'

        newFlashes[ticker.symbol] = { dir, ts: now }

        const basePrice = ticker.price - ticker.change
        const newChange = +(ticker.change + nudge).toFixed(2)
        const newChangePercent = basePrice !== 0
          ? +(newChange / basePrice * 100).toFixed(2)
          : ticker.changePercent

        return { ...ticker, price: newPrice, change: newChange, changePercent: newChangePercent }
      }))

      if (Object.keys(newFlashes).length > 0) {
        setFlashState(newFlashes)
        if (flashTimeout.current) clearTimeout(flashTimeout.current)
        flashTimeout.current = setTimeout(() => setFlashState({}), 700)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex h-3 w-3 flex-shrink-0 mt-1">
            <span
              className="animate-live-pulse absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: 'var(--hype-red)' }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: 'var(--hype-red)' }}
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none">
            <span style={{ color: 'var(--hype-red)' }}>Live</span>{' '}
            <span className="text-primary">Hyped</span>{' '}
            <span style={{ color: 'var(--hype-green)' }}>Stocks</span>
          </h1>
        </div>

        {/* Time period filter */}
        <div className="flex border-b border-default mb-8">
          {TIME_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-mono font-bold border-b-2 -mb-[1px] transition-all duration-150 ${
                activeTab === tab
                  ? 'border-hype-green text-hype-green'
                  : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ticker grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {tickers.map(ticker => (
            <TrendingTickerCard
              key={ticker.symbol}
              ticker={ticker}
              flash={flashState[ticker.symbol] ?? null}
              maxMentions={maxMentions}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
