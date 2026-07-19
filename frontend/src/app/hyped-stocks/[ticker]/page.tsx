'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import PriceChart from '@/components/ticker/PriceChart'
import IndicatorSummaryCards, { type IndicatorCardData } from '@/components/ticker/IndicatorSummaryCards'
import {
  type OHLCVPoint,
  computeIndicators,
  interpretRSI,
  interpretMACD,
  interpretBollinger,
  interpretVWAP,
} from '@/lib/indicators'
import { useApiClient } from '@/lib/useApiClient'

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

interface HypeBreakdownDto {
  symbol: string
  currentScore: number
  redditScore: number
  newsScore: number
  volumeScore: number
  priceScore: number
  verdict: string
  currentPrice: number
  priceChange: number
  changePercent: number
  scoreHistory: { timestamp: string; score: number }[]
  sources: { source: string; content: string; polarity: string }[]
}

interface WatchlistItemDto {
  id: number
  tickerSymbol: string
  addedAt: string
}

const VERDICT_MAP: Record<string, { label: string; color: string }> = {
  HYPE_CONFIRMED:       { label: 'Hype Confirmed',       color: '#62C073' },
  PURE_HYPE:            { label: 'Pure Hype',            color: '#FF990A' },
  HIDDEN_MOMENTUM:      { label: 'Hidden Momentum',      color: '#52A8FF' },
  BEARISH_CONFIRMATION: { label: 'Bearish Confirmation', color: '#FF6166' },
}

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
  const { user, isLoaded } = useUser()
  const { apiCall } = useApiClient()

  const [activeRange, setActiveRange] = useState<RangeLabel>('1D')
  const [ohlcvData,   setOhlcvData]   = useState<OHLCVPoint[]>([])
  const [meta,        setMeta]        = useState<StockMeta | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [chartError,  setChartError]  = useState<string | null>(null)

  const [hypeData,    setHypeData]    = useState<HypeBreakdownDto | null>(null)
  const [hypeLoading, setHypeLoading] = useState(true)
  const [hypeError,   setHypeError]   = useState<string | null>(null)

  const [watchlisted,     setWatchlisted]     = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  useEffect(() => {
    if (!ticker) return
    const r = TIME_RANGES.find(r => r.label === activeRange)!
    const controller = new AbortController()
    loadChart(ticker, r.interval, r.range, controller.signal).catch(() => {})
    return () => controller.abort()
  }, [ticker, activeRange])

  useEffect(() => {
    if (!isLoaded || !ticker) return
    let active = true

    setHypeLoading(true)
    setHypeError(null)

    apiCall(`/api/hype/${ticker}`)
      .then((data: HypeBreakdownDto) => { if (active) setHypeData(data) })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof Error && err.message.includes('404')) setHypeError('not_found')
        else setHypeError('failed')
      })
      .finally(() => { if (active) setHypeLoading(false) })

    apiCall('/api/watchlist')
      .then((items: WatchlistItemDto[]) => {
        if (active) setWatchlisted(items.some(item => item.tickerSymbol === ticker))
      })
      .catch(() => {})

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, ticker])

  async function fetchHypeData() {
    setHypeLoading(true)
    setHypeError(null)
    try {
      const data: HypeBreakdownDto = await apiCall(`/api/hype/${ticker}`)
      setHypeData(data)
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setHypeError('not_found')
      } else {
        setHypeError('failed')
      }
    } finally {
      setHypeLoading(false)
    }
  }

  async function handleWatchlistToggle() {
    if (!user?.id || watchlistLoading) return
    setWatchlistLoading(true)
    try {
      if (watchlisted) {
        await apiCall(`/api/watchlist/${ticker}`, { method: 'DELETE' })
        setWatchlisted(false)
      } else {
        await apiCall(`/api/watchlist/${ticker}`, { method: 'POST' })
        setWatchlisted(true)
      }
    } catch {
      // keep current state on error
    } finally {
      setWatchlistLoading(false)
    }
  }

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

      const timestamps: number[]        = result.timestamp ?? []
      const quote = result.indicators?.quote?.[0] ?? {}
      const opens: (number | null)[]    = quote.open   ?? []
      const highs: (number | null)[]    = quote.high   ?? []
      const lows: (number | null)[]     = quote.low    ?? []
      const closes: (number | null)[]   = quote.close  ?? []
      const volumes: (number | null)[]  = quote.volume ?? []

      const isValid = (n: number | null | undefined): n is number =>
        n !== null && n !== undefined && !isNaN(n)

      const bars: OHLCVPoint[] = timestamps
        .map((ts, i): OHLCVPoint | null => {
          const open = opens[i]
          const high = highs[i]
          const low = lows[i]
          const close = closes[i]
          const volume = volumes[i]
          if (!isValid(open) || !isValid(high) || !isValid(low) || !isValid(close) || !isValid(volume)) return null
          return { time: ts, open, high, low, close, volume }
        })
        .filter((b): b is OHLCVPoint => b !== null)

      setOhlcvData(bars)
      setMeta({
        longName:            result.meta?.longName            ?? symbol,
        regularMarketPrice:  result.meta?.regularMarketPrice  ?? 0,
        fiftyTwoWeekHigh:    result.meta?.fiftyTwoWeekHigh    ?? 0,
        fiftyTwoWeekLow:     result.meta?.fiftyTwoWeekLow     ?? 0,
        regularMarketVolume: result.meta?.regularMarketVolume ?? 0,
      })
      setLoading(false)
    } catch (err) {
      if (signal.aborted) return
      setOhlcvData([])
      setMeta(null)
      setChartError('Could not load chart data')
      setLoading(false)
    }
  }

  const signals = hypeData ? [
    { name: 'Reddit Velocity',  score: hypeData.redditScore },
    { name: 'News Sentiment',   score: hypeData.newsScore   },
    { name: 'Volume Spike',     score: hypeData.volumeScore },
    { name: '52-Week Position', score: hypeData.priceScore  },
  ] : []

  const verdict = hypeData ? (VERDICT_MAP[hypeData.verdict] ?? { label: hypeData.verdict, color: 'var(--text-secondary)' }) : null

  const indicators = useMemo(() => computeIndicators(ohlcvData), [ohlcvData])

  const indicatorCards = useMemo<IndicatorCardData[]>(() => {
    if (!ohlcvData.length) return []
    const i = ohlcvData.length - 1
    const closeNow = ohlcvData[i].close
    const rsiNow = indicators.rsi[i]
    const macdNow = indicators.macd.macdLine[i]
    const signalNow = indicators.macd.signalLine[i]
    const bbNow = {
      upper: indicators.bollinger.upper[i],
      middle: indicators.bollinger.middle[i],
      lower: indicators.bollinger.lower[i],
    }
    const vwapNow = indicators.vwap[i]

    const rsiInterp = interpretRSI(rsiNow)
    const macdInterp = interpretMACD(macdNow, signalNow)
    const bbInterp = interpretBollinger(closeNow, bbNow)
    const vwapInterp = interpretVWAP(closeNow, vwapNow)

    return [
      {
        label: 'RSI (14)',
        value: rsiNow !== undefined ? rsiNow.toFixed(1) : '—',
        interpretationLabel: rsiInterp.label,
        color: rsiInterp.color,
      },
      {
        label: 'MACD',
        value: macdInterp.label,
        interpretationLabel: macdNow !== undefined && signalNow !== undefined
          ? `${macdNow.toFixed(2)} vs ${signalNow.toFixed(2)}`
          : '—',
        color: macdInterp.color,
      },
      {
        label: 'Bollinger Bands',
        value: closeNow !== undefined ? fmtUSD(closeNow) : '—',
        interpretationLabel: bbInterp.label,
        color: bbInterp.color,
      },
      {
        label: 'VWAP',
        value: vwapNow !== undefined ? fmtUSD(vwapNow) : '—',
        interpretationLabel: vwapInterp.label,
        color: vwapInterp.color,
      },
    ]
  }, [ohlcvData, indicators])

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
            onClick={handleWatchlistToggle}
            disabled={watchlistLoading}
            className="flex-shrink-0 px-4 py-2 rounded-lg font-mono text-sm font-bold border transition-all duration-200 disabled:opacity-60"
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
            <PriceChart
              data={ohlcvData}
              rsiData={indicators.rsi}
              macdData={indicators.macd}
              bollingerData={indicators.bollinger}
              vwapData={indicators.vwap}
              loading={loading}
              error={chartError}
            />
          </div>
        </section>

        {/* ── Technical Indicators ── */}
        {indicatorCards.length > 0 && (
          <section className="mb-8">
            <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                Technical Indicators
              </span>
            </div>
            <IndicatorSummaryCards cards={indicatorCards} />
          </section>
        )}

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

          {hypeLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                />
              ))}
            </div>
          ) : hypeError === 'not_found' ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                No hype data found for {ticker} yet. Check back after the next pipeline cycle.
              </p>
            </div>
          ) : hypeError === 'failed' ? (
            <div className="text-center py-6">
              <p className="font-mono text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                Could not load hype data.
              </p>
              <button
                onClick={fetchHypeData}
                className="px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                Retry
              </button>
            </div>
          ) : hypeData ? (
            <>
              <div className="flex items-center gap-6 mb-6">
                <div
                  className="text-7xl font-black font-mono leading-none"
                  style={{ color: scoreColor(hypeData.currentScore) }}
                >
                  {hypeData.currentScore}
                </div>
                <div>
                  <div className="text-sm font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Overall Hype Score
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>out of 100</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {signals.map(sig => {
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
            </>
          ) : null}
        </section>

        {/* ── Verdict ── */}
        {hypeData && verdict && (
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
              <div className="text-3xl font-black font-mono mb-2" style={{ color: verdict.color }}>
                {verdict.label}
              </div>
            </div>
          </section>
        )}

        {/* ── Source Evidence ── */}
        {!hypeLoading && !hypeError && (
          <section className="mb-8">
            <div className="pb-2 mb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                Sources
              </span>
            </div>

            {hypeData && hypeData.sources.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                  No sources found for this ticker in the last 24 hours.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(hypeData?.sources ?? []).map((src, i) => (
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
                            backgroundColor: `${SOURCE_COLORS[src.source] ?? '#888'}22`,
                            color: SOURCE_COLORS[src.source] ?? '#888',
                          }}
                        >
                          {src.source}
                        </span>
                        <span
                          className="text-sm font-mono truncate"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {src.content}
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
            )}
          </section>
        )}

      </div>
    </div>
  )
}
