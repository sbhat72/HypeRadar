'use client'

import { SignIn } from '@clerk/nextjs'

const TICKER_ITEMS = [
  { symbol: 'GME', change: '+184.2%', up: true },
  { symbol: 'NVDA', change: '+7.3%', up: true },
  { symbol: 'AMC', change: '-3.1%', up: false },
  { symbol: 'TSLA', change: '+12.8%', up: true },
  { symbol: 'AAPL', change: '+1.4%', up: true },
  { symbol: 'PLTR', change: '+22.6%', up: true },
  { symbol: 'BBBY', change: '-61.0%', up: false },
  { symbol: 'SPY', change: '-0.8%', up: false },
  { symbol: 'RBLX', change: '+5.9%', up: true },
  { symbol: 'MSTR', change: '+31.5%', up: true },
  { symbol: 'RIVN', change: '-4.2%', up: false },
  { symbol: 'SOFI', change: '+9.1%', up: true },
]

const PRICE_SIGNALS = [
  { symbol: 'GME', score: 94, verdict: 'HYPE CONFIRMED', price: '$24.18', change: '+184%', up: true },
  { symbol: 'NVDA', score: 87, verdict: 'HIDDEN MOMENTUM', price: '$138.40', change: '+7.3%', up: true },
  { symbol: 'PLTR', score: 79, verdict: 'HYPE CONFIRMED', price: '$87.22', change: '+22.6%', up: true },
  { symbol: 'AMC', score: 31, verdict: 'BEARISH SIGNAL', price: '$3.92', change: '-3.1%', up: false },
]

const CANDLESTICKS = [
  { h: 52, body: 32, up: true, delay: '0s' },
  { h: 40, body: 28, up: false, delay: '0.3s' },
  { h: 68, body: 44, up: true, delay: '0.6s' },
  { h: 36, body: 24, up: false, delay: '0.9s' },
  { h: 80, body: 56, up: true, delay: '1.2s' },
  { h: 44, body: 30, up: true, delay: '1.5s' },
  { h: 56, body: 36, up: false, delay: '1.8s' },
  { h: 72, body: 48, up: true, delay: '2.1s' },
]

export default function LoginPage() {
  const doubledTickers = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="min-h-screen bg-base flex flex-col chart-grid overflow-hidden">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-hype-red via-hype-green to-hype-blue opacity-60" />

      <div className="flex flex-1">
        {/* ── Left: Brand Panel ── */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 px-12 py-10 relative overflow-hidden border-r border-[var(--border-default)]">
          {/* Candlestick decorations */}
          <div className="absolute bottom-24 right-0 flex items-end gap-2 pr-6 opacity-20 pointer-events-none">
            {CANDLESTICKS.map((c, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 animate-price-pulse"
                style={{ animationDelay: c.delay }}
              >
                <div
                  className="w-px"
                  style={{
                    height: `${(c.h - c.body) / 2}px`,
                    backgroundColor: c.up ? 'var(--hype-green)' : 'var(--hype-red)',
                  }}
                />
                <div
                  className="w-3 rounded-sm"
                  style={{
                    height: `${c.body}px`,
                    backgroundColor: c.up ? 'var(--hype-green)' : 'var(--hype-red)',
                    boxShadow: c.up ? '0 0 6px var(--hype-green)' : '0 0 6px var(--hype-red)',
                  }}
                />
                <div
                  className="w-px"
                  style={{
                    height: `${(c.h - c.body) / 2}px`,
                    backgroundColor: c.up ? 'var(--hype-green)' : 'var(--hype-red)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top glow blob */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(98,192,115,0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute top-1/3 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,97,102,0.06) 0%, transparent 70%)',
            }}
          />

          {/* Brand */}
          <div className="animate-fade-in-up relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-base"
                style={{ background: 'var(--hype-green)', boxShadow: '0 0 16px var(--hype-green)' }}
              >
                HR
              </div>
              <span className="text-muted text-sm font-mono tracking-[0.3em] uppercase">
                LIVE
                <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 mb-0.5 animate-blink bg-hype-green" />
              </span>
            </div>

            <h1 className="text-6xl font-black tracking-tight text-primary leading-none mt-4">
              Hype
              <br />
              <span className="text-hype-green">Radar</span>
            </h1>

            <p className="mt-5 text-lg text-muted font-mono">
              Track the Hype.
              <br />
              <span className="text-secondary">Trade the Signal.</span>
            </p>

            <p className="mt-4 text-sm text-faint max-w-xs leading-relaxed">
              Real-time social sentiment meets market data. Know when the crowd is moving before the price does.
            </p>
          </div>

          {/* Live signals */}
          <div className="relative z-10 space-y-2">
            <p className="text-xs font-mono text-faint mb-3 uppercase tracking-widest">
              Live Hype Signals
            </p>
            {PRICE_SIGNALS.map((s) => (
              <div
                key={s.symbol}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-[var(--border-default)]"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{
                      backgroundColor: s.up ? 'var(--hype-green-bg)' : 'var(--hype-red-bg)',
                      color: s.up ? 'var(--hype-green)' : 'var(--hype-red)',
                    }}
                  >
                    {s.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">{s.symbol}</div>
                    <div className="text-xs text-faint">{s.verdict}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-mono font-bold"
                    style={{ color: s.up ? 'var(--hype-green)' : 'var(--hype-red)' }}
                  >
                    {s.change}
                  </div>
                  <div className="text-xs font-mono text-muted">{s.price}</div>
                </div>
                <div className="ml-3 text-right">
                  <div className="text-xs text-faint">HYPE</div>
                  <div
                    className="text-sm font-black font-mono"
                    style={{ color: s.up ? 'var(--hype-green)' : 'var(--hype-red)' }}
                  >
                    {s.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Auth Panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-base"
              style={{ background: 'var(--hype-green)', boxShadow: '0 0 12px var(--hype-green)' }}
            >
              HR
            </div>
            <span className="text-2xl font-black text-primary">
              Hype<span className="text-hype-green">Radar</span>
            </span>
          </div>

          <SignIn
            appearance={{
              variables: {
                colorBackground: '#111114',
                colorPrimary: '#62c073',
                colorDanger: '#ff6166',
                colorSuccess: '#62c073',
                colorWarning: '#ff990a',
                colorNeutral: '#c0c0cc',
                colorForeground: '#f0f0f4',
                colorInput: '#18181c',
                colorInputForeground: '#f0f0f4',
                colorBorder: '#2a2a30',
                borderRadius: '12px',
                fontFamily: 'var(--font-geist-sans)',
              },
              elements: {
                card: 'border border-[#2a2a30] shadow-2xl',
                headerTitle: 'text-[#f0f0f4] font-black',
                headerSubtitle: 'text-[#808090]',
                formFieldInput:
                  'border-[#2a2a30] focus:border-[#62c073] focus:ring-[#62c073] text-[#f0f0f4] placeholder:text-[#505060]',
                formButtonPrimary:
                  'bg-[#62c073] hover:bg-[#4da860] text-[#080809] font-bold transition-colors',
                footerActionLink: 'text-[#62c073] hover:text-[#4da860]',
                identityPreviewEditButton: 'text-[#62c073]',
                dividerLine: 'bg-[#2a2a30]',
                dividerText: 'text-[#505060]',
                socialButtonsBlockButton:
                  'border-[#2a2a30] bg-[#18181c] text-[#f0f0f4] hover:bg-[#1e1e23] transition-colors',
                socialButtonsBlockButtonText: 'text-[#c0c0cc]',
                formFieldLabel: 'text-[#c0c0cc]',
                formFieldErrorText: 'text-[#ff6166]',
                alertText: 'text-[#ff6166]',
              },
            }}
          />
        </div>
      </div>

      {/* ── Ticker tape ── */}
      <div
        className="h-9 flex items-center overflow-hidden border-t border-[var(--border-default)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <div className="ticker-tape-track flex items-center gap-0">
          {doubledTickers.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 px-4 text-xs font-mono shrink-0">
              <span className="text-muted">{item.symbol}</span>
              <span style={{ color: item.up ? 'var(--hype-green)' : 'var(--hype-red)' }}>
                {item.change}
              </span>
              <span className="text-faint mx-2">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
