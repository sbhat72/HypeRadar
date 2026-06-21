'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function TickerDeepDivePage() {
  const params = useParams()
  const ticker = (params.ticker as string)?.toUpperCase() ?? ''

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-xs font-mono text-faint tracking-widest uppercase mb-3">
          Deep Dive
        </div>
        <div className="text-7xl font-black font-mono text-primary mb-4 tracking-wider">
          {ticker}
        </div>
        <div
          className="text-base font-mono font-bold mb-1"
          style={{ color: 'var(--hype-green)' }}
        >
          Coming soon
        </div>
        <div className="text-sm font-mono text-muted">
          Full signal breakdown launching next
        </div>
      </div>

      <Link
        href="/hyped-stocks"
        className="text-xs font-mono text-muted hover:text-secondary transition-colors border border-default hover:border-subtle px-4 py-2 rounded-xl"
      >
        ← Back to dashboard
      </Link>
    </div>
  )
}
