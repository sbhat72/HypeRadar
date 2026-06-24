export interface MockTicker {
  symbol: string
  price: number
  change: number
  changePercent: number
  mentions: number
  hypeScore: number
}

export const MOCK_TICKERS: MockTicker[] = [
  { symbol: 'GME',  price:  18.75, change:   2.10, changePercent:  12.60, mentions: 4821, hypeScore: 91 },
  { symbol: 'TSLA', price: 245.80, change:   3.24, changePercent:   1.34, mentions: 3642, hypeScore: 88 },
  { symbol: 'NVDA', price: 875.40, change: -12.50, changePercent:  -1.41, mentions: 3108, hypeScore: 82 },
  { symbol: 'AMC',  price:   4.32, change:   0.58, changePercent:  15.49, mentions: 2875, hypeScore: 85 },
  { symbol: 'AAPL', price: 192.50, change:  -1.80, changePercent:  -0.93, mentions: 2341, hypeScore: 65 },
  { symbol: 'META', price: 512.30, change:   8.40, changePercent:   1.67, mentions: 1982, hypeScore: 70 },
  { symbol: 'PLTR', price:  28.90, change:   1.45, changePercent:   5.28, mentions: 1742, hypeScore: 76 },
  { symbol: 'SOFI', price:   8.45, change:  -0.32, changePercent:  -3.65, mentions: 1482, hypeScore: 54 },
  { symbol: 'MSFT', price: 415.20, change:   2.75, changePercent:   0.67, mentions: 1284, hypeScore: 58 },
  { symbol: 'AMD',  price: 167.80, change:  -4.20, changePercent:  -2.44, mentions: 1156, hypeScore: 62 },
  { symbol: 'RIVN', price:  12.30, change:   0.85, changePercent:   7.42, mentions: 1043, hypeScore: 69 },
  { symbol: 'LCID', price:   3.18, change:  -0.12, changePercent:  -3.64, mentions:  921, hypeScore: 47 },
  { symbol: 'COIN', price: 228.40, change:  15.70, changePercent:   7.38, mentions:  874, hypeScore: 73 },
  { symbol: 'HOOD', price:  19.65, change:   0.90, changePercent:   4.80, mentions:  763, hypeScore: 52 },
  { symbol: 'SPCE', price:   1.84, change:  -0.08, changePercent:  -4.17, mentions:  642, hypeScore: 38 },
  { symbol: 'NIO',  price:   5.72, change:   0.34, changePercent:   6.32, mentions:  589, hypeScore: 44 },
  { symbol: 'SNOW', price: 145.30, change:  -3.40, changePercent:  -2.29, mentions:  478, hypeScore: 41 },
  { symbol: 'UBER', price:  76.90, change:   1.20, changePercent:   1.59, mentions:  412, hypeScore: 39 },
]
