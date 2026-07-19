'use client'

import { useEffect, useRef } from 'react'
import type { UTCTimestamp } from 'lightweight-charts'
import type { OHLCVPoint, MACDResult, BollingerBandsResult } from '@/lib/indicators'

interface Props {
  data: OHLCVPoint[]
  rsiData: (number | undefined)[]
  macdData: MACDResult
  bollingerData: BollingerBandsResult
  vwapData: (number | undefined)[]
  loading: boolean
  error: string | null
}

const MAIN_PANE_HEIGHT = 320
const MACD_PANE_HEIGHT = 130
const RSI_PANE_HEIGHT = 110
const TOTAL_HEIGHT = MAIN_PANE_HEIGHT + MACD_PANE_HEIGHT + RSI_PANE_HEIGHT

function toLineData(times: number[], values: (number | undefined)[]) {
  return times
    .map((time, i) => ({ time: time as UTCTimestamp, value: values[i] }))
    .filter((p): p is { time: UTCTimestamp; value: number } => p.value !== undefined)
}

export default function PriceChart({ data, rsiData, macdData, bollingerData, vwapData, loading, error }: Props) {
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
        height: TOTAL_HEIGHT,
        handleScroll: true,
        handleScale: true,
      })

      const times = data.map(p => p.time)

      // ── Pane 0: price area + Bollinger Bands + VWAP overlays ──
      const series = chart.addSeries(lc.AreaSeries, {
        lineColor: '#62C073',
        topColor: 'rgba(98, 192, 115, 0.28)',
        bottomColor: 'rgba(98, 192, 115, 0.00)',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      })
      series.setData(data.map(p => ({ time: p.time as UTCTimestamp, value: p.close })))

      const bbUpper = chart.addSeries(lc.LineSeries, {
        color: '#52A8FF',
        lineStyle: lc.LineStyle.Dashed,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbUpper.setData(toLineData(times, bollingerData.upper))

      const bbMiddle = chart.addSeries(lc.LineSeries, {
        color: '#C0C0CC',
        lineStyle: lc.LineStyle.Dotted,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbMiddle.setData(toLineData(times, bollingerData.middle))

      const bbLower = chart.addSeries(lc.LineSeries, {
        color: '#52A8FF',
        lineStyle: lc.LineStyle.Dashed,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bbLower.setData(toLineData(times, bollingerData.lower))

      const vwapSeries = chart.addSeries(lc.LineSeries, {
        color: '#FF990A',
        lineStyle: lc.LineStyle.Solid,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      vwapSeries.setData(toLineData(times, vwapData))

      // ── Pane 1: MACD ──
      const macdHistogram = chart.addSeries(
        lc.HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        1,
      )
      macdHistogram.setData(
        times
          .map((time, i) => ({ time: time as UTCTimestamp, value: macdData.histogram[i] }))
          .filter((p): p is { time: UTCTimestamp; value: number } => p.value !== undefined)
          .map(p => ({ ...p, color: p.value >= 0 ? '#62C073' : '#FF6166' })),
      )

      const macdLineSeries = chart.addSeries(
        lc.LineSeries,
        { color: '#52A8FF', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        1,
      )
      macdLineSeries.setData(toLineData(times, macdData.macdLine))

      const macdSignalSeries = chart.addSeries(
        lc.LineSeries,
        { color: '#FF990A', lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
        1,
      )
      macdSignalSeries.setData(toLineData(times, macdData.signalLine))

      chart.panes()[1]?.setHeight(MACD_PANE_HEIGHT)

      // ── Pane 2: RSI ──
      const rsiSeries = chart.addSeries(
        lc.LineSeries,
        { color: '#C0C0CC', lineWidth: 2, priceLineVisible: false, lastValueVisible: false },
        2,
      )
      rsiSeries.setData(toLineData(times, rsiData))
      rsiSeries.createPriceLine({
        price: 70,
        color: '#FF6166',
        lineStyle: lc.LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'Overbought',
      })
      rsiSeries.createPriceLine({
        price: 30,
        color: '#62C073',
        lineStyle: lc.LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
        title: 'Oversold',
      })

      chart.panes()[2]?.setHeight(RSI_PANE_HEIGHT)

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
  }, [data, rsiData, macdData, bollingerData, vwapData, loading, error])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: TOTAL_HEIGHT }}>
        <div className="text-xs font-mono text-muted animate-pulse">Loading chart…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: TOTAL_HEIGHT }}>
        <div className="text-xs font-mono" style={{ color: 'var(--hype-red)' }}>{error}</div>
      </div>
    )
  }

  if (!data.length && !loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: TOTAL_HEIGHT }}>
        <div className="text-xs font-mono text-muted">No chart data available</div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full" style={{ minHeight: TOTAL_HEIGHT }} />
}
