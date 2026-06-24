'use client'

import Link from 'next/link'

export interface TickerData {
  symbol: string
  price: number
  change: number
  changePercent: number
  mentions: number
  hypeScore: number
}

export interface FlashEntry {
  dir: 'up' | 'down'
  ts: number
}

interface Props {
  ticker: TickerData
  flash: FlashEntry | null
  maxMentions: number
}

const BAR_HEIGHTS = ['35%', '52%', '68%', '84%', '100%']

function getHeatColor(intensity: number): string {
  if (intensity < 0.33) return '#52A8FF'
  if (intensity < 0.66) return '#FF990A'
  return '#FF6166'
}

export default function TrendingTickerCard({ ticker, flash, maxMentions }: Props) {
  const isPositive = ticker.change >= 0
  const intensity = ticker.mentions / maxMentions
  const activeBars = Math.max(1, Math.ceil(intensity * 5))
  const heatColor = getHeatColor(intensity)

  return (
    <Link href={`/hyped-stocks/${ticker.symbol}`} className="block group">
      <div className="bg-surface border border-default rounded-2xl p-4 cursor-pointer group-hover:border-subtle group-hover:bg-elevated transition-all duration-150">

        {/* Symbol + hype score */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xl font-black font-mono text-primary tracking-widest">
            {ticker.symbol}
          </span>
          <span className="text-xs font-mono bg-elevated border border-default px-2 py-0.5 rounded-lg">
            <span className="text-secondary">{ticker.hypeScore}</span>
            <span className="text-faint">/100</span>
          </span>
        </div>

        {/* Price with flash highlight */}
        <div className="relative inline-block mb-1 rounded-lg px-1 -ml-1">
          {flash && (
            <span
              key={`${flash.dir}-${flash.ts}`}
              className={`absolute inset-0 rounded-lg pointer-events-none ${
                flash.dir === 'up' ? 'animate-flash-green' : 'animate-flash-red'
              }`}
            />
          )}
          <span className="relative text-2xl font-bold font-mono text-primary">
            ${ticker.price.toFixed(2)}
          </span>
        </div>

        {/* Change */}
        <div className={`text-sm font-mono font-semibold mb-3 ${isPositive ? 'text-hype-green' : 'text-hype-red'}`}>
          {isPositive ? '+' : ''}{ticker.change.toFixed(2)}{' '}
          <span className="text-xs opacity-80">
            ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
          </span>
        </div>

        {/* Mention count */}
        <div className="text-xs font-mono mb-3">
          <span className="text-secondary">{ticker.mentions.toLocaleString()}</span>
          <span className="text-faint"> mentions</span>
        </div>

        {/* Heat indicator — 5-bar signal strength */}
        <div className="flex gap-1 items-end" style={{ height: '20px' }}>
          {BAR_HEIGHTS.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-colors duration-300"
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
  )
}
