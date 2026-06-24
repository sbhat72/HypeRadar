'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useApiClient } from '@/lib/api-client'

const TICKER_RE = /^[A-Z]{1,5}$/
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface AlertResponse {
  id: number
  tickerSymbol: string
  threshold: number
  notificationType: string
  createdAt: string
  lastTriggeredAt: string | null
}

const MOCK_TRIGGERED = [
  { id: 't1', ticker: 'GME',  threshold: 75, firedScore: 89, firedAt: '2025-01-15T14:32:00Z' },
  { id: 't2', ticker: 'NVDA', threshold: 80, firedScore: 92, firedAt: '2025-02-03T09:17:00Z' },
  { id: 't3', ticker: 'TSLA', threshold: 65, firedScore: 71, firedAt: '2025-03-21T16:45:00Z' },
  { id: 't4', ticker: 'AMC',  threshold: 60, firedScore: 84, firedAt: '2025-04-08T11:22:00Z' },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function AlertsPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { apiCall } = useApiClient()

  const [alerts, setAlerts] = useState<AlertResponse[]>([])
  const [ticker, setTicker] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [tickerError, setTickerError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  async function loadAlerts() {
    try {
      const data: AlertResponse[] = await apiCall('/api/alerts')
      setAlerts(data)
    } catch {
      // leave alerts empty on error
    }
  }

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!TICKER_RE.test(ticker)) {
      setTickerError('Ticker must be 1–5 uppercase letters (e.g. TSLA)')
      return
    }
    setTickerError('')
    setFormError('')
    setSubmitting(true)

    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tickerSymbol: ticker, threshold }),
      })

      if (!res.ok) {
        if (res.status === 400) {
          const text = await res.text().catch(() => '')
          if (
            text.toLowerCase().includes('duplicate') ||
            text.toLowerCase().includes('already exists') ||
            text.toLowerCase().includes('already have')
          ) {
            setFormError(`An active alert already exists for ${ticker}`)
          } else {
            setFormError('Ticker not found')
          }
        } else {
          setFormError('Failed to create alert. Please try again.')
        }
        return
      }

      await loadAlerts()
      const savedTicker = ticker
      setTicker('')
      setThreshold(70)
      showToast(`Alert set for ${savedTicker} at hype score ${threshold}`)
    } catch {
      setFormError('Failed to create alert. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiCall(`/api/alerts/${id}`, { method: 'DELETE' })
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch {
      // silently fail
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</span>
      </div>
    )
  }

  const sliderBg = `linear-gradient(to right, #62C073 0%, #62C073 ${threshold}%, #FF6166 ${threshold}%, #FF6166 100%)`
  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <style>{`
        .alert-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .alert-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #62C073;
          cursor: pointer;
          box-shadow: 0 0 6px #62C07388;
        }
        .alert-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #62C073;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 6px #62C07388;
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Create Alert Form ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <h1 className="text-xl font-black font-mono tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            Set a Hype Alert
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Ticker input */}
            <div>
              <label className="block text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                Ticker Symbol
              </label>
              <input
                type="text"
                value={ticker}
                onChange={e => {
                  setTicker(e.target.value.toUpperCase())
                  if (tickerError) setTickerError('')
                  if (formError) setFormError('')
                }}
                placeholder="e.g. TSLA"
                maxLength={5}
                className="w-full px-4 py-3 rounded-xl font-mono text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: `1px solid ${tickerError ? '#FF6166' : 'var(--border-default)'}`,
                  color: 'var(--text-primary)',
                }}
                onFocus={e => { if (!tickerError) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                onBlur={e => { if (!tickerError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
              />
              {tickerError && (
                <p className="mt-1.5 text-xs font-mono" style={{ color: '#FF6166' }}>
                  {tickerError}
                </p>
              )}
            </div>

            {/* Hype threshold slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Hype Threshold
                </label>
                <span className="text-lg font-black font-mono" style={{ color: 'var(--hype-green)' }}>
                  Threshold: {threshold}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="alert-slider"
                style={{ background: sliderBg }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>0</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>100</span>
              </div>
            </div>

            {/* Read-only email */}
            <div>
              <label className="block text-xs font-mono tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                Notification Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 rounded-xl font-mono text-sm cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-faint)',
                  opacity: 0.7,
                }}
              />
            </div>

            {/* Inline form error */}
            {formError && (
              <p className="text-xs font-mono" style={{ color: '#FF6166' }}>
                {formError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-mono font-bold text-sm transition-all duration-150 mt-1 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--hype-green-bg)',
                color: 'var(--hype-green)',
                border: '1px solid var(--hype-green)',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#62C07322' }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = 'var(--hype-green-bg)' }}
            >
              {submitting ? 'Setting Alert…' : 'Set Alert'}
            </button>
          </form>
        </div>

        {/* ── Active Alerts ── */}
        <div className="pb-3 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-lg font-black font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Active Alerts
          </h2>
        </div>

        {alerts.length === 0 ? (
          <div
            className="rounded-2xl p-8 mb-10 text-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
              No active alerts. Set one above to get notified when a stock crosses your hype threshold.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-10">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="rounded-2xl p-5 flex items-start justify-between gap-4"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xl font-black font-mono tracking-widest" style={{ color: 'var(--text-primary)' }}>
                      {alert.tickerSymbol}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--hype-green-bg)', color: 'var(--hype-green)' }}
                    >
                      Active
                    </span>
                  </div>
                  <div className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Hype score ≥ {alert.threshold}
                  </div>
                  <div className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                    {email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(alert.id)}
                  className="flex-shrink-0 p-2 rounded-lg transition-colors duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FF6166')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Delete alert"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Triggered Alerts History ── */}
        <div className="pb-3 mb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h2 className="text-lg font-black font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Triggered Alerts
          </h2>
        </div>

        <div className="flex flex-col gap-3 pb-8">
          {MOCK_TRIGGERED.map(t => (
            <div
              key={t.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-black font-mono tracking-widest" style={{ color: 'var(--text-primary)' }}>
                      {t.ticker}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#FF990A22', color: '#FF990A' }}
                    >
                      Triggered
                    </span>
                  </div>
                  <div className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Threshold: {t.threshold} · Fired at hype score {t.firedScore}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                    {formatDate(t.firedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-5 py-4 rounded-xl font-mono text-sm max-w-sm z-50"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderLeft: '3px solid #62C073',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
