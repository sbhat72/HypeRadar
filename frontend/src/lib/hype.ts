export interface HypeBreakdownDto {
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

export const VERDICT_MAP: Record<string, { label: string; color: string }> = {
  HYPE_CONFIRMED:       { label: 'Hype Confirmed',       color: '#62C073' },
  PURE_HYPE:            { label: 'Pure Hype',            color: '#FF990A' },
  HIDDEN_MOMENTUM:      { label: 'Hidden Momentum',      color: '#52A8FF' },
  BEARISH_CONFIRMATION: { label: 'Bearish Confirmation', color: '#FF6166' },
}

export function scoreColor(score: number): string {
  if (score > 60) return '#62C073'
  if (score >= 40) return '#FF990A'
  return '#FF6166'
}
