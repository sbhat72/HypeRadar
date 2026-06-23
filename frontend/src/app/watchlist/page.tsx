'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { getWatchlist, removeFromWatchlist } from '@/lib/watchlist'
import { MOCK_TICKERS } from '@/lib/mock-tickers'

const TIME_TABS = ['1H', '1D', '1W', '1M', '1Y'] as const
type TimeTab = typeof TIME_TABS[number]

const TIME_MULTIPLIERS: Record<TimeTab, number> = {
  '1H': 0.12,
  '1D': 1,
  '1W': 3.4,
  '1M': 9.2,
  '1Y': 47,
}

interface NewsItem {
  ticker: string
  source: 'REUTERS' | 'CNBC' | 'MARKETWATCH' | 'NASDAQ'
  headline: string
  polarity: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
}

const SOURCE_COLORS: Record<string, string> = {
  REUTERS:     '#FF8000',
  CNBC:        '#004B87',
  MARKETWATCH: '#0058A8',
  NASDAQ:      '#2775CA',
}

const MOCK_NEWS: NewsItem[] = [
  { ticker: 'GME',  source: 'REUTERS',     headline: 'GameStop shares surge as retail investors pile back in',              polarity: 'POSITIVE' },
  { ticker: 'GME',  source: 'CNBC',        headline: 'Short interest on GME climbs to multi-month high amid Reddit frenzy', polarity: 'NEGATIVE' },
  { ticker: 'GME',  source: 'MARKETWATCH', headline: 'GameStop options volume spikes ahead of earnings report',             polarity: 'NEUTRAL'  },
  { ticker: 'TSLA', source: 'REUTERS',     headline: 'Tesla deliveries beat expectations, shares rally pre-market',         polarity: 'POSITIVE' },
  { ticker: 'TSLA', source: 'CNBC',        headline: 'Analysts raise Tesla price targets following strong Q4 numbers',      polarity: 'POSITIVE' },
  { ticker: 'TSLA', source: 'NASDAQ',      headline: 'Tesla faces headwinds in European market amid EV price wars',         polarity: 'NEGATIVE' },
  { ticker: 'NVDA', source: 'CNBC',        headline: 'NVIDIA posts record revenue driven by data center AI demand',         polarity: 'POSITIVE' },
  { ticker: 'NVDA', source: 'REUTERS',     headline: 'NVDA chip export restrictions tighten, shares dip after hours',       polarity: 'NEGATIVE' },
  { ticker: 'NVDA', source: 'MARKETWATCH', headline: 'Wall Street remains bullish on NVIDIA despite valuation concerns',    polarity: 'NEUTRAL'  },
  { ticker: 'AMC',  source: 'NASDAQ',      headline: 'AMC announces debt restructuring plan to improve balance sheet',      polarity: 'NEUTRAL'  },
  { ticker: 'AMC',  source: 'CNBC',        headline: 'Meme stock momentum returns as AMC volume surges 400%',               polarity: 'POSITIVE' },
  { ticker: 'AAPL', source: 'REUTERS',     headline: 'Apple Vision Pro shipments reportedly below initial forecasts',        polarity: 'NEGATIVE' },
  { ticker: 'AAPL', source: 'CNBC',        headline: 'iPhone 16 demand tracking ahead of prior generation, analysts say',   polarity: 'POSITIVE' },
  { ticker: 'META', source: 'CNBC',        headline: 'Meta AI assistant reaches 1 billion users faster than expected',       polarity: 'POSITIVE' },
  { ticker: 'META', source: 'REUTERS',     headline: 'EU antitrust probe targets Meta advertising data practices',           polarity: 'NEGATIVE' },
  { ticker: 'PLTR', source: 'NASDAQ',      headline: 'Palantir wins major U.S. defense contract worth $500M',               polarity: 'POSITIVE' },
  { ticker: 'PLTR', source: 'MARKETWATCH', headline: 'Palantir commercial revenue growth slows, investors cautious',         polarity: 'NEGATIVE' },
  { ticker: 'SOFI', source: 'CNBC',        headline: 'SoFi Bank grows deposits 25% year-over-year amid fintech rally',      polarity: 'POSITIVE' },
  { ticker: 'SOFI', source: 'REUTERS',     headline: 'SoFi student loan servicing faces regulatory scrutiny',                polarity: 'NEGATIVE' },
  { ticker: 'MSFT', source: 'NASDAQ',      headline: 'Microsoft Azure cloud growth accelerates on Copilot AI demand',        polarity: 'POSITIVE' },
  { ticker: 'MSFT', source: 'REUTERS',     headline: 'Microsoft under EU investigation over Teams bundling practices',        polarity: 'NEGATIVE' },
  { ticker: 'AMD',  source: 'CNBC',        headline: 'AMD gains AI chip market share with new MI300X accelerator',           polarity: 'POSITIVE' },
  { ticker: 'AMD',  source: 'MARKETWATCH', headline: 'PC market weakness weighs on AMD consumer segment outlook',            polarity: 'NEGATIVE' },
  { ticker: 'RIVN', source: 'REUTERS',     headline: 'Rivian production ramp accelerates, trims full-year loss guidance',    polarity: 'POSITIVE' },
  { ticker: 'RIVN', source: 'CNBC',        headline: 'Rivian cash burn rate remains a concern for long-term investors',      polarity: 'NEUTRAL'  },
  { ticker: 'LCID', source: 'NASDAQ',      headline: 'Lucid Motors expands to Middle East market with new showrooms',        polarity: 'POSITIVE' },
  { ticker: 'LCID', source: 'REUTERS',     headline: 'Lucid cuts production target for second consecutive quarter',           polarity: 'NEGATIVE' },
  { ticker: 'COIN', source: 'CNBC',        headline: 'Coinbase trading volume surges as Bitcoin hits all-time high',          polarity: 'POSITIVE' },
  { ticker: 'COIN', source: 'NASDAQ',      headline: 'SEC v. Coinbase case progresses, legal uncertainty weighs on shares',  polarity: 'NEGATIVE' },
  { ticker: 'HOOD', source: 'MARKETWATCH', headline: 'Robinhood crypto trading volumes up 180% quarter-over-quarter',        polarity: 'POSITIVE' },
  { ticker: 'HOOD', source: 'CNBC',        headline: 'Robinhood faces PFOF ban risk as SEC reviews payment-for-order rules', polarity: 'NEGATIVE' },
  { ticker: 'SPCE', source: 'REUTERS',     headline: 'Virgin Galactic completes milestone commercial spaceflight',            polarity: 'POSITIVE' },
  { ticker: 'SPCE', source: 'NASDAQ',      headline: 'SPCE cash reserves shrink to critical levels, dilution risk high',     polarity: 'NEGATIVE' },
  { ticker: 'NIO',  source: 'REUTERS',     headline: 'NIO unveils battery swap network expansion across 50 new cities',      polarity: 'POSITIVE' },
  { ticker: 'NIO',  source: 'CNBC',        headline: 'China EV price war intensifies, NIO margins under pressure',            polarity: 'NEGATIVE' },
  { ticker: 'SNOW', source: 'MARKETWATCH', headline: 'Snowflake lands major enterprise AI data platform contract',            polarity: 'POSITIVE' },
  { ticker: 'SNOW', source: 'REUTERS',     headline: 'Snowflake CEO transition weighs on near-term investor confidence',      polarity: 'NEUTRAL'  },
  { ticker: 'UBER', source: 'CNBC',        headline: 'Uber reaches GAAP profitability milestone, raises full-year guidance',  polarity: 'POSITIVE' },
  { ticker: 'UBER', source: 'NASDAQ',      headline: 'Uber autonomous partnership with Waymo expands to new cities',          polarity: 'POSITIVE' },
]

const BAR_HEIGHTS = ['35%', '52%', '68%', '84%', '100%']

function getHeatColor(intensity: number): string {
  if (intensity < 0.33) return '#52A8FF'
  if (intensity < 0.66) return '#FF990A'
  return '#FF6166'
}

export default function WatchlistPage() {
  const { user, isLoaded } = useUser()
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<TimeTab>('1D')

  useEffect(() => {
    if (!isLoaded || !user?.id) return
    setWatchlistSymbols(getWatchlist(user.id))
  }, [isLoaded, user?.id])

  const watchlistData = MOCK_TICKERS.filter(t => watchlistSymbols.includes(t.symbol))
  const maxMentions = Math.max(...watchlistData.map(t => t.mentions), 1)
  const multiplier = TIME_MULTIPLIERS[activeTab]

  const combinedChange = watchlistData.reduce((sum, t) => sum + t.change * multiplier, 0)
  const combinedChangePct =
    watchlistData.length > 0
      ? watchlistData.reduce((sum, t) => sum + t.changePercent * multiplier, 0) / watchlistData.length
      : 0
  const totalMentions = watchlistData.reduce((sum, t) => sum + t.mentions, 0)
  const avgHypeScore =
    watchlistData.length > 0
      ? Math.round(watchlistData.reduce((sum, t) => sum + t.hypeScore, 0) / watchlistData.length)
      : 0

  const filteredNews = MOCK_NEWS.filter(n => watchlistSymbols.includes(n.ticker))
  const isPositiveCombined = combinedChange >= 0

  function handleRemove(symbol: string) {
    if (!user?.id) return
    removeFromWatchlist(user.id, symbol)
    setWatchlistSymbols(prev => prev.filter(s => s !== symbol))
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    )
  }

  if (watchlistSymbols.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <p className="text-xl font-mono font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            No stocks in your watchlist yet. Head to the dashboard to add some.
          </p>
          <Link
            href="/hyped-stocks"
            className="inline-block px-6 py-3 rounded-xl font-mono text-sm font-bold transition-colors"
            style={{
              backgroundColor: 'var(--hype-green-bg)',
              color: 'var(--hype-green)',
              border: '1px solid var(--hype-green)',
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Summary Panel ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex flex-col sm:flex-row gap-8">

            {/* Performance block */}
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Combined Performance
              </div>
              <div
                className="text-4xl font-black font-mono mb-1"
                style={{ color: isPositiveCombined ? 'var(--hype-green)' : 'var(--hype-red)' }}
              >
                {isPositiveCombined ? '+' : ''}${combinedChange.toFixed(2)}
              </div>
              <div
                className="text-base font-mono font-semibold mb-4"
                style={{ color: isPositiveCombined ? 'var(--hype-green)' : 'var(--hype-red)' }}
              >
                {isPositiveCombined ? '+' : ''}{combinedChangePct.toFixed(2)}%
              </div>
              {/* Time period toggle */}
              <div className="flex gap-1">
                {TIME_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1 text-xs font-mono font-bold rounded transition-all"
                    style={
                      activeTab === tab
                        ? { backgroundColor: 'var(--hype-green-bg)', color: 'var(--hype-green)' }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical divider */}
            <div
              className="hidden sm:block flex-shrink-0"
              style={{ width: '1px', backgroundColor: 'var(--border-default)' }}
            />

            {/* Hype block */}
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-mono tracking-widest uppercase mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Hype Overview
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
                    {totalMentions.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    Total Mentions
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black font-mono" style={{ color: 'var(--hype-orange)' }}>
                    {avgHypeScore}
                  </div>
                  <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                    Avg Hype Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Your Watchlist ── */}
        <div className="pb-3 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-lg font-black font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Your Watchlist
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {watchlistData.map(ticker => {
            const isPos = ticker.change >= 0
            const intensity = ticker.mentions / maxMentions
            const activeBars = Math.max(1, Math.ceil(intensity * 5))
            const heatColor = getHeatColor(intensity)
            return (
              <div key={ticker.symbol} className="relative">
                <Link href={`/hyped-stocks/${ticker.symbol}`} className="block">
                  <div
                    className="rounded-2xl p-4 transition-all duration-150 cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  >
                    {/* Symbol — with right padding so the × button doesn't overlap */}
                    <div className="mb-3 pr-6">
                      <span
                        className="text-xl font-black font-mono tracking-widest"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {ticker.symbol}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-2xl font-bold font-mono mb-1" style={{ color: 'var(--text-primary)' }}>
                      ${ticker.price.toFixed(2)}
                    </div>

                    {/* Change */}
                    <div
                      className="text-sm font-mono font-semibold mb-3"
                      style={{ color: isPos ? 'var(--hype-green)' : 'var(--hype-red)' }}
                    >
                      {isPos ? '+' : ''}{ticker.change.toFixed(2)}{' '}
                      <span className="text-xs opacity-80">
                        ({isPos ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
                      </span>
                    </div>

                    {/* Mention count */}
                    <div className="text-xs font-mono mb-3">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {ticker.mentions.toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--text-faint)' }}> mentions</span>
                    </div>

                    {/* Heat indicator — same as dashboard */}
                    <div className="flex gap-1 items-end" style={{ height: '20px' }}>
                      {BAR_HEIGHTS.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height,
                            backgroundColor: i < activeBars ? heatColor : 'var(--bg-subtle)',
                            boxShadow: i < activeBars ? `0 0 5px ${heatColor}55` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </Link>

                {/* Remove button — outside Link so it doesn't trigger navigation */}
                <button
                  type="button"
                  onClick={() => handleRemove(ticker.symbol)}
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-base font-mono rounded transition-colors duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF6166')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Remove from watchlist"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Watchlist News ── */}
        {filteredNews.length > 0 && (
          <>
            <div className="pb-3 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="text-lg font-black font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Watchlist News
              </h2>
            </div>

            <div className="flex flex-col gap-3 pb-8">
              {filteredNews.map((news, i) => (
                <a
                  key={i}
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl p-4 transition-all duration-150 no-underline"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Source badge */}
                    <span
                      className="flex-shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${SOURCE_COLORS[news.source]}22`,
                        color: SOURCE_COLORS[news.source],
                      }}
                    >
                      {news.source}
                    </span>

                    {/* Headline */}
                    <span
                      className="flex-1 min-w-0 text-sm font-mono"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {news.headline}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Ticker tag */}
                      <span
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        {news.ticker}
                      </span>

                      {/* Polarity badge */}
                      <span
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                        style={
                          news.polarity === 'POSITIVE'
                            ? { backgroundColor: 'var(--hype-green-bg)', color: 'var(--hype-green)' }
                            : news.polarity === 'NEGATIVE'
                            ? { backgroundColor: 'var(--hype-red-bg)', color: 'var(--hype-red)' }
                            : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }
                        }
                      >
                        {news.polarity}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
