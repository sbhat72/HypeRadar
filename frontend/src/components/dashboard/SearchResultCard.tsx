'use client'

import Link from 'next/link'
import { VERDICT_MAP, scoreColor } from '@/lib/hype'

export interface SearchResultData {
  symbol: string
  hypeScore: number | null
  verdict: string | null
  price: number | null
  changePercent: number | null
}

interface Props {
  status: 'found' | 'not_found' | 'error'
  ticker: string
  data?: SearchResultData
  onDismiss: () => void
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onDismiss() }}
      aria-label="Dismiss search result"
      className="flex-shrink-0 p-1.5 rounded-lg transition-colors duration-150"
      style={{ color: 'var(--text-muted)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

export default function SearchResultCard({ status, ticker, data, onDismiss }: Props) {
  if (status === 'not_found') {
    return (
      <div
        className="rounded-2xl p-6 flex items-start justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          No hype data found for {ticker}.
        </p>
        <DismissButton onDismiss={onDismiss} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className="rounded-2xl p-6 flex items-start justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          Something went wrong searching for {ticker}. Please try again.
        </p>
        <DismissButton onDismiss={onDismiss} />
      </div>
    )
  }

  const d = data!
  const verdict = d.verdict ? (VERDICT_MAP[d.verdict] ?? { label: d.verdict, color: 'var(--text-secondary)' }) : null
  const hasChange = d.changePercent != null
  const isPositive = hasChange && d.changePercent! >= 0
  const changeColor = hasChange ? (isPositive ? 'text-hype-green' : 'text-hype-red') : 'text-secondary'

  return (
    <div className="relative max-w-sm">
      <Link href={`/hyped-stocks/${d.symbol}`} className="block group">
        <div className="bg-surface border border-default rounded-2xl p-4 pr-10 cursor-pointer group-hover:border-subtle group-hover:bg-elevated transition-all duration-150">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xl font-black font-mono text-primary tracking-widest">{d.symbol}</span>
            <span className="text-xs font-mono bg-elevated border border-default px-2 py-0.5 rounded-lg">
              <span style={{ color: d.hypeScore != null ? scoreColor(d.hypeScore) : 'var(--text-secondary)' }}>
                {d.hypeScore ?? '--'}
              </span>
              <span className="text-faint">/100</span>
            </span>
          </div>

          <div className="mb-1 text-2xl font-bold font-mono text-primary">
            {d.price != null ? `$${d.price.toFixed(2)}` : '--'}
          </div>

          <div className={`text-sm font-mono font-semibold mb-3 ${changeColor}`}>
            {hasChange ? `${isPositive ? '+' : ''}${d.changePercent!.toFixed(2)}%` : '--'}
          </div>

          {verdict && (
            <span
              className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: `${verdict.color}22`, color: verdict.color }}
            >
              {verdict.label}
            </span>
          )}
        </div>
      </Link>

      <div className="absolute top-3 right-3">
        <DismissButton onDismiss={onDismiss} />
      </div>
    </div>
  )
}
