'use client'

import { useEffect, useRef } from 'react'
import type { UTCTimestamp } from 'lightweight-charts'

export interface ChartPoint {
  time: number
  value: number
}

interface Props {
  data: ChartPoint[]
  loading: boolean
  error: string | null
}

export default function PriceChart({ data, loading, error }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    cleanupRef.current?.()
    cleanupRef.current = null

    if (!containerRef.current || !data.length) return

    let cancelled = false

    import('lightweight-charts').then((lc) => {
      if (cancelled || !containerRef.current) return

      const chart = lc.createChart(containerRef.current, {
        layout: {
          background: { type: lc.ColorType.Solid, color: '#111114' },
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
        timeScale: { borderColor: '#2a2a30', timeVisible: true, secondsVisible: false },
        width: containerRef.current.clientWidth,
        height: 320,
        handleScroll: true,
        handleScale: true,
      })

      const series = chart.addSeries(lc.AreaSeries, {
        lineColor: '#62C073',
        topColor: 'rgba(98, 192, 115, 0.28)',
        bottomColor: 'rgba(98, 192, 115, 0.00)',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      })

      series.setData(data.map(p => ({ time: p.time as UTCTimestamp, value: p.value })))
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
  }, [data, loading, error])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 320 }}>
        <div className="text-xs font-mono text-muted animate-pulse">Loading chart…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: 320 }}>
        <div className="text-xs font-mono" style={{ color: 'var(--hype-red)' }}>{error}</div>
      </div>
    )
  }

  if (!data.length && !loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 320 }}>
        <div className="text-xs font-mono text-muted">No chart data available</div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" style={{ minHeight: 320 }} />
}
