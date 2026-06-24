'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import TrendingTickerCard, { type TickerData, type FlashEntry } from '@/components/dashboard/TrendingTickerCard'
import { useApiClient } from '@/lib/api-client'

interface TrendingTickerDto {
  symbol: string
  score: number
  priceChange: number
  changePercent: number
  mentionCount: number
}

const TIME_TABS = ['1H', '1D', '1W', '1M'] as const
type TimeTab = typeof TIME_TABS[number]

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        minHeight: '160px',
      }}
    />
  )
}

export default function HypedStocksPage() {
  const { isLoaded } = useAuth()
  const { apiCall } = useApiClient()

  const [tickers, setTickers] = useState<TickerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TimeTab>('1D')
  const [flashState, setFlashState] = useState<Record<string, FlashEntry | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const maxMentions = Math.max(...tickers.map(t => t.mentions), 1)

  async function fetchTickers() {
    setLoading(true)
    setError(null)
    try {
      const data: TrendingTickerDto[] = await apiCall('/api/tickers/trending?limit=20')
      setTickers(data.map(d => ({
        symbol: d.symbol,
        price: Math.abs(d.priceChange) || 0.01,
        change: d.priceChange,
        changePercent: d.changePercent,
        mentions: d.mentionCount,
        hypeScore: d.score,
      })))
    } catch {
      setError('Could not load trending tickers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    fetchTickers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  useEffect(() => {
    const interval = setInterval(() => {
      const newFlashes: Record<string, FlashEntry> = {}
      const now = Date.now()

      setTickers(prev => {
        if (prev.length === 0) return prev
        return prev.map(ticker => {
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
        })
      })

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

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="font-mono text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {error}
            </p>
            <button
              onClick={fetchTickers}
              className="px-5 py-2 rounded-xl font-mono text-sm font-bold transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
