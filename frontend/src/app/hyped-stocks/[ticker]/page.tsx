'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PriceChart, { type ChartPoint } from '@/components/ticker/PriceChart'

const TIME_RANGES = [
  { label: '1D', interval: '5m',  range: '1d'  },
  { label: '1W', interval: '1h',  range: '5d'  },
  { label: '1M', interval: '1d',  range: '1mo' },
  { label: '1Y', interval: '1wk', range: '1y'  },
] as const

type RangeLabel = typeof TIME_RANGES[number]['label']

interface StockMeta {
  longName: string
  regularMarketPrice: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  regularMarketVolume: number
}

const MOCK_SIGNALS = [
  { name: 'Reddit Velocity',   score: 78 },
  { name: 'News Sentiment',    score: 65 },
  { name: 'Volume Spike',      score: 82 },
  { name: '52-Week Position',  score: 54 },
]

const MOCK_SOURCES = [
  { source: 'REDDIT',      headline: 'Short interest at 30% — this is just like 2021 all over again',            polarity: 'POSITIVE' },
  { source: 'REUTERS',     headline: 'Stock surges amid unprecedented retail investor activity on social media', polarity: 'POSITIVE' },
  { source: 'CNBC',        headline: 'Analysts warn of extreme volatility as meme stock momentum returns',       polarity: 'NEGATIVE' },
  { source: 'MARKETWATCH', headline: 'Options market signals unusual call volume spike ahead of earnings',       polarity: 'NEUTRAL'  },
  { source: 'NASDAQ',      headline: 'Short sellers face mounting pressure as shares climb double digits',       polarity: 'POSITIVE' },
  { source: 'REDDIT',      headline: 'Fundamentals don\'t matter when the squeeze is on — diamond hands only',  polarity: 'POSITIVE' },
]

const SOURCE_COLORS: Record<string, string> = {
  REDDIT:      '#FF4500',
  REUTERS:     '#FF8000',
  CNBC:        '#004B87',
  MARKETWATCH: '#0058A8',
  NASDAQ:      '#2775CA',
}

function scoreColor(score: number): string {
  if (score > 60) return '#62C073'
  if (score >= 40) return '#FF990A'
  return '#FF6166'
}

function fmtUSD(n: number): string {
  return `$${n.toFixed(2)}`
}

function fmtVolume(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function TickerDeepDivePage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase() ?? ''

  const [activeRange, setActiveRange] = useState<RangeLabel>('1D')
  const [chartData,   setChartData]   = useState<ChartPoint[]>([])
  const [meta,        setMeta]        = useState<StockMeta | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [chartError,  setChartError]  = useState<string | null>(null)
  const [watchlisted, setWatchlisted] = useState(false)

  useEffect(() => {
    if (!ticker) return
    const r = TIME_RANGES.find(r => r.label === activeRange)!
    const controller = new AbortController()
    loadChart(ticker, r.interval, r.range, controller.signal)
    return () => controller.abort()
  }, [ticker, activeRange])

  async function loadChart(symbol: string, interval: string, range: string, signal: AbortSignal) {
    setLoading(true)
    setChartError(null)
    try {
      const res = await fetch(
        `/api/yahoo-finance?ticker=${symbol}&interval=${interval}&range=${range}`,
        { signal },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const result = json?.chart?.result?.[0]
      if (!result) throw new Error('No data returned')

      const timestamps: number[]      = result.timestamp ?? []
      const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? []

      const points: ChartPoint[] = timestamps
        .map((ts, i) => ({ time: ts, value: closes[i] as number }))
        .filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value))

      setChartData(points)
      setMeta({
        longName:            result.meta?.longName            ?? symbol,
        regularMarketPrice:  result.meta?.regularMarketPrice  ?? 0,
        fiftyTwoWeekHigh:    result.meta?.fiftyTwoWeekHigh    ?? 0,
        fiftyTwoWeekLow:     result.meta?.fiftyTwoWeekLow     ?? 0,
        regularMarketVolume: result.meta?.regularMarketVolume ?? 0,
      })
      setLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setChartData([])
      setMeta(null)
      setChartError('Could not load chart data')
      setLoading(false)
    }
  }

  const overallScore = 74

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Back nav */}
        <Link
          href="/hyped-stocks"
          className="inline-flex items-center gap-1 text-xs font-mono text-muted hover:text-secondary mb-6 transition-colors"
        >
          ← Back to dashboard
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-5xl font-black font-mono tracking-wider" style={{ color: 'var(--text-primary)' }}>
              {ticker}
            </h1>
            <p className="text-sm font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
              {meta?.longName ?? '—'}
            </p>
          </div>
          <button
            onClick={() => setWatchlisted(w => !w)}
            className="flex-shrink-0 px-4 py-2 rounded-lg font-mono text-sm font-bold border transition-all duration-200"
            style={watchlisted
              ? { backgroundColor: 'var(--hype-green-bg)', borderColor: 'var(--hype-green)', color: 'var(--hype-green)' }
              : { backgroundColor: 'transparent', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }
            }
          >
            {watchlisted ? '✓ Added' : '+ Add to Watchlist'}
          </button>
        </div>

        {/* ── Price Chart ── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Price Chart
            </span>
            <div className="flex gap-1">
              {TIME_RANGES.map(r => (
                <button
                  key={r.label}
                  onClick={() => setActiveRange(r.label)}
                  className="px-3 py-1 text-xs font-mono font-bold rounded transition-all"
                  style={activeRange === r.label
                    ? { backgroundColor: 'var(--hype-green-bg)', color: 'var(--hype-green)' }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
            <PriceChart data={chartData} loading={loading} error={chartError} />
          </div>
        </section>

        {/* ── Financial Summary ── */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Current Price', value: fmtUSD(meta.regularMarketPrice) },
              { label: '52-Week High',  value: fmtUSD(meta.fiftyTwoWeekHigh)  },
              { label: '52-Week Low',   value: fmtUSD(meta.fiftyTwoWeekLow)   },
              { label: 'Volume',        value: fmtVolume(meta.regularMarketVolume) },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
                <div className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Hype Score Breakdown ── */}
        <section className="mb-8">
          <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Hype Score
            </span>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl font-black font-mono leading-none" style={{ color: scoreColor(overallScore) }}>
              {overallScore}
            </div>
            <div>
              <div className="text-sm font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                Overall Hype Score
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>out of 100</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOCK_SIGNALS.map(sig => {
              const color = scoreColor(sig.score)
              return (
                <div
                  key={sig.name}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {sig.name}
                    </span>
                    <span className="text-sm font-mono font-bold" style={{ color }}>
                      {sig.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sig.score}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Verdict ── */}
        <section className="mb-8">
          <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Verdict
            </span>
          </div>
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="text-3xl font-black font-mono mb-2" style={{ color: '#FF990A' }}>
              Pure Hype
            </div>
            <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              Social noise not yet reflected in price action. Monitor for a confirming catalyst before entry.
            </p>
          </div>
        </section>

        {/* ── Source Evidence ── */}
        <section className="mb-8">
          <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Sources
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_SOURCES.map((src, i) => (
              <button
                key={i}
                type="button"
                className="block w-full text-left rounded-xl p-4 transition-colors"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="flex-shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${SOURCE_COLORS[src.source]}22`,
                        color: SOURCE_COLORS[src.source],
                      }}
                    >
                      {src.source}
                    </span>
                    <span
                      className="text-sm font-mono truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {src.headline}
                    </span>
                  </div>
                  <span
                    className="flex-shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={
                      src.polarity === 'POSITIVE'
                        ? { backgroundColor: 'var(--hype-green-bg)', color: 'var(--hype-green)' }
                        : src.polarity === 'NEGATIVE'
                        ? { backgroundColor: 'var(--hype-red-bg)', color: 'var(--hype-red)' }
                        : { backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }
                    }
                  >
                    {src.polarity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
