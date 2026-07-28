'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import TrendingTickerCard, { type TickerData, type FlashEntry } from '@/components/dashboard/TrendingTickerCard'
import SearchResultCard, { type SearchResultData } from '@/components/dashboard/SearchResultCard'
import { useApiClient } from '@/lib/useApiClient'

interface TrendingTickerDto {
  symbol: string
  score: number
  mentionCount: number
  price: number | null
  priceChange: number | null
  changePercent: number | null
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
  const { isLoaded, isSignedIn } = useAuth()
  const { apiCall } = useApiClient()

  const [tickers, setTickers] = useState<TickerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TimeTab>('1D')
  const [flashState, setFlashState] = useState<Record<string, FlashEntry | null>>({})
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const [searchInput, setSearchInput] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    status: 'found' | 'not_found' | 'error'
    ticker: string
    data?: SearchResultData
  } | null>(null)

  const maxMentions = Math.max(...tickers.map(t => t.mentions), 1)

  const fetchTickers = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data: TrendingTickerDto[] = await apiCall(`/api/tickers/trending?limit=20&period=${activeTab}`)
      if (requestIdRef.current !== requestId) return
      setTickers(data.map(d => ({
        symbol: d.symbol,
        price: d.price ?? null,
        change: d.priceChange ?? null,
        changePercent: d.changePercent ?? null,
        mentions: d.mentionCount,
        hypeScore: d.score,
      })))
    } catch {
      if (requestIdRef.current === requestId) setError('Could not load trending tickers.')
    } finally {
      if (requestIdRef.current === requestId) setLoading(false)
    }
  }, [apiCall, activeTab])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchTickers()
  }, [isLoaded, isSignedIn, fetchTickers])

  useEffect(() => {
    const interval = setInterval(() => {
      const newFlashes: Record<string, FlashEntry> = {}
      const now = Date.now()

      setTickers(prev => {
        if (prev.length === 0) return prev
        return prev.map(ticker => {
          if (Math.random() > 0.6) return ticker

          if (ticker.price == null || ticker.change == null) {
            newFlashes[ticker.symbol] = { dir: Math.random() >= 0.5 ? 'up' : 'down', ts: now }
            return ticker
          }

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

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ticker = searchInput.trim().toUpperCase()
    if (!ticker) return

    setSearchLoading(true)
    try {
      const data = await apiCall(`/api/hype/${ticker}`)
      setSearchResult({
        status: 'found',
        ticker,
        data: {
          symbol: data?.symbol ?? ticker,
          hypeScore: data?.currentScore ?? null,
          verdict: data?.verdict ?? null,
          price: data?.currentPrice ?? null,
          changePercent: data?.changePercent ?? null,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setSearchResult({ status: 'not_found', ticker })
      } else {
        setSearchResult({ status: 'error', ticker })
      }
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchDismiss() {
    setSearchResult(null)
    setSearchInput('')
  }

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

        {/* Ticker Search */}
        <div className="mb-8">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Search ticker (e.g. TSLA)"
              maxLength={10}
              className="flex-1 px-4 py-3 rounded-xl font-mono text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-3 rounded-xl font-mono font-bold text-sm transition-all duration-150 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--hype-green-bg)',
                color: 'var(--hype-green)',
                border: '1px solid var(--hype-green)',
              }}
            >
              {searchLoading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResult && (
          <section className="mb-8">
            <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                Search Results
              </span>
            </div>
            <SearchResultCard
              status={searchResult.status}
              ticker={searchResult.ticker}
              data={searchResult.data}
              onDismiss={handleSearchDismiss}
            />
          </section>
        )}

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
