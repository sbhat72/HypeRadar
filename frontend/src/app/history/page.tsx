'use client'

import { useState, useEffect, useRef } from 'react'
import type { UTCTimestamp } from 'lightweight-charts'
import Navbar from '@/components/ui/Navbar'

// ─── Data ────────────────────────────────────────────────────────────────────

interface HypeEvent {
  ticker: string
  name: string
  dateRange: string
  period1: number
  period2: number
  description: string
  peakPrice: string
  peakGain: string
  tag: 'Short Squeeze' | 'Meme Stock' | 'Earnings Catalyst' | 'Social Media Pump'
}

const EVENTS: HypeEvent[] = [
  {
    ticker: 'GME',
    name: 'The GameStop Short Squeeze',
    dateRange: 'Jan 2021',
    period1: 1609459200,
    period2: 1612137600,
    description:
      "Reddit's r/wallstreetbets coordinated a historic short squeeze against hedge funds shorting GameStop. GME rose from $20 to nearly $500 in weeks.",
    peakPrice: '$483',
    peakGain: '+2,400%',
    tag: 'Short Squeeze',
  },
  {
    ticker: 'AMC',
    name: 'AMC Entertainment Squeeze',
    dateRange: 'May–Jun 2021',
    period1: 1619827200,
    period2: 1625097600,
    description:
      'AMC became the second major meme stock as retail traders piled in. The stock jumped from $10 to $72 at its peak driven entirely by social momentum.',
    peakPrice: '$72',
    peakGain: '+620%',
    tag: 'Meme Stock',
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA AI Surge',
    dateRange: 'May 2023',
    period1: 1682899200,
    period2: 1685577600,
    description:
      'After announcing blowout earnings driven by AI chip demand, NVIDIA saw a one-day gain of 24% — the largest single-day gain ever for a $700B company.',
    peakPrice: '$419',
    peakGain: '+24% in one day',
    tag: 'Earnings Catalyst',
  },
  {
    ticker: 'BBBY',
    name: 'Bed Bath & Beyond Squeeze',
    dateRange: 'Aug 2022',
    period1: 1659312000,
    period2: 1661990400,
    description:
      'BBBY surged 400% in two weeks fuelled by Reddit hype and a large position held by Ryan Cohen. The stock later collapsed as the hype faded.',
    peakPrice: '$30',
    peakGain: '+400%',
    tag: 'Short Squeeze',
  },
  {
    ticker: 'DOGE',
    name: 'Dogecoin Elon Pump',
    dateRange: 'Apr–May 2021',
    period1: 1617235200,
    period2: 1620864000,
    description:
      'A series of tweets from Elon Musk pushed Dogecoin from $0.06 to $0.74 — a 14x gain in weeks. A textbook example of social media-driven Pure Hype.',
    peakPrice: '$0.74',
    peakGain: '+14,000%',
    tag: 'Social Media Pump',
  },
  {
    ticker: 'GME',
    name: 'Roaring Kitty Returns',
    dateRange: 'May–Jun 2024',
    period1: 1714521600,
    period2: 1717200000,
    description:
      'Keith Gill (Roaring Kitty) returned to social media after three years and GME surged 200% in days. A reminder that social momentum can restart at any time.',
    peakPrice: '$64',
    peakGain: '+200%',
    tag: 'Social Media Pump',
  },
]

const TAG_COLORS: Record<HypeEvent['tag'], { bg: string; text: string }> = {
  'Short Squeeze':     { bg: '#3C1618', text: '#FF6166' },
  'Meme Stock':        { bg: '#331B00', text: '#FF990A' },
  'Earnings Catalyst': { bg: '#0F2E18', text: '#62C073' },
  'Social Media Pump': { bg: '#2E1938', text: '#BF7AF0' },
}

// ─── EventChart ───────────────────────────────────────────────────────────────

interface EventChartProps {
  ticker: string
  period1: number
  period2: number
  peakGain: string
}

function EventChart({ ticker, period1, period2, peakGain }: EventChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef   = useRef<(() => void) | null>(null)
  const [chartData, setChartData] = useState<{ time: UTCTimestamp; value: number }[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Fetch price data
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setChartData([])

    fetch(
      `/api/yahoo-finance-history?ticker=${encodeURIComponent(ticker)}&period1=${period1}&period2=${period2}`,
      { signal: controller.signal },
    )
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: unknown) => {
        if (cancelled) return
        const result = (json as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } })?.chart?.result?.[0]
        if (!result) throw new Error('No data returned')

        const timestamps: number[]          = result.timestamp ?? []
        const closes: (number | null)[]     = result.indicators?.quote?.[0]?.close ?? []
        const data: { time: UTCTimestamp; value: number }[] = []

        for (let i = 0; i < timestamps.length; i++) {
          const v = closes[i]
          if (v != null && !isNaN(v)) {
            data.push({ time: timestamps[i] as UTCTimestamp, value: v })
          }
        }

        if (data.length === 0) throw new Error('No price data available for this period')
        setChartData(data)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled || controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load chart')
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [ticker, period1, period2])

  // Render chart once data is available
  useEffect(() => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (!containerRef.current || chartData.length === 0) return

    let cancelled = false

    import('lightweight-charts').then(lc => {
      if (cancelled || !containerRef.current) return

      const chart = lc.createChart(containerRef.current, {
        layout: {
          background: { type: lc.ColorType.Solid, color: '#18181c' },
          textColor: '#808090',
        },
        grid: {
          vertLines: { color: '#2a2a30' },
          horzLines: { color: '#2a2a30' },
        },
        crosshair: {
          vertLine: { color: '#3a3a42' },
          horzLine: { color: '#3a3a42' },
        },
        rightPriceScale: { borderColor: '#2a2a30' },
        timeScale:        { borderColor: '#2a2a30', timeVisible: true, secondsVisible: false },
        width:  containerRef.current.clientWidth,
        height: 280,
        handleScroll: true,
        handleScale:  true,
      })

      const series = chart.addSeries(lc.AreaSeries, {
        lineColor:        '#62C073',
        topColor:         'rgba(98, 192, 115, 0.28)',
        bottomColor:      'rgba(98, 192, 115, 0.00)',
        lineWidth:        2,
        priceLineVisible: false,
        lastValueVisible: true,
      })

      series.setData(chartData)

      // Find peak price index
      let peakIdx = 0
      for (let i = 1; i < chartData.length; i++) {
        if (chartData[i].value > chartData[peakIdx].value) peakIdx = i
      }

      // Add peak marker using v5 createSeriesMarkers API
      lc.createSeriesMarkers(series, [
        {
          time:     chartData[peakIdx].time,
          position: 'aboveBar',
          color:    '#62C073',
          shape:    'arrowDown',
          text:     `Peak ${peakGain}`,
          size:     1,
        },
      ])

      chart.timeScale().fitContent()

      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth })
        }
      })
      ro.observe(containerRef.current)

      cleanupRef.current = () => {
        ro.disconnect()
        chart.remove()
      }
    })

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [chartData, peakGain])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 280 }}>
        <span className="text-xs font-mono animate-pulse" style={{ color: 'var(--text-muted)' }}>
          Fetching chart data…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: 280 }}>
        <span className="text-xs font-mono" style={{ color: 'var(--hype-red)' }}>{error}</span>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" style={{ minHeight: 280 }} />
}

// ─── HistoryEventCard ─────────────────────────────────────────────────────────

function HistoryEventCard({ event }: { event: HypeEvent }) {
  const [showChart, setShowChart] = useState(false)
  const colors = TAG_COLORS[event.tag]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
    >
      {/* Card body */}
      <div className="p-6">
        {/* Tag badge */}
        <span
          className="inline-block text-xs font-mono font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {event.tag}
        </span>

        {/* Ticker + name + date */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>
            {event.ticker}
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {event.name}
          </span>
          <span className="ml-auto text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            {event.dateRange}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {event.description}
        </p>

        {/* Peak stats + button */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
              Peak Price
            </div>
            <div className="text-sm font-bold font-mono" style={{ color: '#62C073' }}>
              {event.peakPrice}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
              Peak Gain
            </div>
            <div className="text-sm font-bold font-mono" style={{ color: '#62C073' }}>
              {event.peakGain}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowChart(s => !s)}
            className="ml-auto text-xs font-mono font-bold px-4 py-2 rounded-lg transition-colors duration-150"
            style={{
              backgroundColor: showChart ? 'transparent' : '#0F2E18',
              color:           '#62C073',
              border:          '1px solid #62C073',
            }}
          >
            {showChart ? 'Close Chart' : 'View Chart'}
          </button>
        </div>
      </div>

      {/* Inline chart */}
      {showChart && (
        <div
          className="rounded-2xl mx-4 mb-4 p-4"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <EventChart
            ticker={event.ticker}
            period1={event.period1}
            period2={event.period2}
            peakGain={event.peakGain}
          />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black font-mono tracking-tight">
            <span style={{ color: '#62C073' }}>Hype</span>
            <span style={{ color: '#FF6166' }}> History</span>
          </h1>
          <p className="mt-3 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            The moments that moved markets. Powered by social momentum.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: '1.25rem',
              width: '1px',
              backgroundColor: 'var(--border-default)',
            }}
          />

          <div className="space-y-8">
            {EVENTS.map((event, idx) => (
              <div key={idx} className="relative" style={{ paddingLeft: '3.5rem' }}>
                {/* Timeline dot */}
                <div
                  className="absolute rounded-full border-2"
                  style={{
                    left:            'calc(1.25rem - 6px)',
                    top:             '1.5rem',
                    width:           '13px',
                    height:          '13px',
                    backgroundColor: 'var(--bg-base)',
                    borderColor:     TAG_COLORS[event.tag].text,
                  }}
                />
                <HistoryEventCard event={event} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
