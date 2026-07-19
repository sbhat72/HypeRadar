export interface OHLCVPoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Interpretation {
  label: string
  color: string
}

const COLOR_MUTED = '#808090'
const COLOR_SECONDARY = '#C0C0CC'
const COLOR_GREEN = '#62C073'
const COLOR_RED = '#FF6166'
const COLOR_ORANGE = '#FF990A'

export function sma(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(values.length).fill(undefined)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) result[i] = sum / period
  }
  return result
}

export function ema(values: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(values.length).fill(undefined)
  if (values.length < period) return result

  const seed = sma(values, period)[period - 1]
  if (seed === undefined) return result

  result[period - 1] = seed
  const multiplier = 2 / (period + 1)
  for (let i = period; i < values.length; i++) {
    const prev = result[i - 1] as number
    result[i] = (values[i] - prev) * multiplier + prev
  }
  return result
}

export function rsi(closes: number[], period = 14): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(closes.length).fill(undefined)
  if (closes.length < period + 1) return result

  let sumGain = 0
  let sumLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) sumGain += diff
    else sumLoss += -diff
  }
  let avgGain = sumGain / period
  let avgLoss = sumLoss / period
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

export interface MACDResult {
  macdLine: (number | undefined)[]
  signalLine: (number | undefined)[]
  histogram: (number | undefined)[]
}

export function macd(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult {
  const emaFast = ema(closes, fastPeriod)
  const emaSlow = ema(closes, slowPeriod)

  const macdLine: (number | undefined)[] = closes.map((_, i) => {
    const fast = emaFast[i]
    const slow = emaSlow[i]
    return fast !== undefined && slow !== undefined ? fast - slow : undefined
  })

  // Compact the defined macd values, run EMA over them, then re-expand to original indices.
  const definedIndices: number[] = []
  const definedValues: number[] = []
  macdLine.forEach((v, i) => {
    if (v !== undefined) {
      definedIndices.push(i)
      definedValues.push(v)
    }
  })

  const signalLine: (number | undefined)[] = new Array(closes.length).fill(undefined)
  if (definedValues.length >= signalPeriod) {
    const signalEma = ema(definedValues, signalPeriod)
    signalEma.forEach((v, i) => {
      if (v !== undefined) signalLine[definedIndices[i]] = v
    })
  }

  const histogram: (number | undefined)[] = closes.map((_, i) => {
    const m = macdLine[i]
    const s = signalLine[i]
    return m !== undefined && s !== undefined ? m - s : undefined
  })

  return { macdLine, signalLine, histogram }
}

export interface BollingerBandsResult {
  upper: (number | undefined)[]
  middle: (number | undefined)[]
  lower: (number | undefined)[]
}

export function bollingerBands(closes: number[], period = 20, stdDevMultiplier = 2): BollingerBandsResult {
  const middle = sma(closes, period)
  const upper: (number | undefined)[] = new Array(closes.length).fill(undefined)
  const lower: (number | undefined)[] = new Array(closes.length).fill(undefined)

  for (let i = period - 1; i < closes.length; i++) {
    const mid = middle[i]
    if (mid === undefined) continue
    let sumSquaredDiff = 0
    for (let j = i - period + 1; j <= i; j++) {
      sumSquaredDiff += (closes[j] - mid) ** 2
    }
    const stdDev = Math.sqrt(sumSquaredDiff / period)
    upper[i] = mid + stdDevMultiplier * stdDev
    lower[i] = mid - stdDevMultiplier * stdDev
  }

  return { upper, middle, lower }
}

export function vwap(bars: OHLCVPoint[]): (number | undefined)[] {
  const result: (number | undefined)[] = new Array(bars.length).fill(undefined)
  let cumPV = 0
  let cumVol = 0
  for (let i = 0; i < bars.length; i++) {
    const typicalPrice = (bars[i].high + bars[i].low + bars[i].close) / 3
    cumPV += typicalPrice * bars[i].volume
    cumVol += bars[i].volume
    result[i] = cumVol === 0 ? undefined : cumPV / cumVol
  }
  return result
}

export interface IndicatorSeries {
  rsi: (number | undefined)[]
  macd: MACDResult
  bollinger: BollingerBandsResult
  vwap: (number | undefined)[]
}

export function computeIndicators(bars: OHLCVPoint[]): IndicatorSeries {
  const closes = bars.map(b => b.close)
  return {
    rsi: rsi(closes),
    macd: macd(closes),
    bollinger: bollingerBands(closes),
    vwap: vwap(bars),
  }
}

export function interpretRSI(value: number | undefined): Interpretation {
  if (value === undefined) return { label: '—', color: COLOR_MUTED }
  if (value > 70) return { label: 'Overbought', color: COLOR_RED }
  if (value >= 60) return { label: 'Approaching Overbought', color: COLOR_ORANGE }
  if (value >= 40) return { label: 'Neutral', color: COLOR_SECONDARY }
  if (value >= 30) return { label: 'Approaching Oversold', color: COLOR_ORANGE }
  return { label: 'Oversold', color: COLOR_GREEN }
}

export function interpretMACD(macdLine: number | undefined, signalLine: number | undefined): Interpretation {
  if (macdLine === undefined || signalLine === undefined) {
    return { label: 'Insufficient Data', color: COLOR_MUTED }
  }
  if (macdLine > signalLine) return { label: 'Bullish', color: COLOR_GREEN }
  if (macdLine < signalLine) return { label: 'Bearish', color: COLOR_RED }
  return { label: 'Neutral', color: COLOR_SECONDARY }
}

export function interpretBollinger(
  close: number | undefined,
  bands: { upper?: number; middle?: number; lower?: number },
): Interpretation {
  const { upper, lower } = bands
  if (close === undefined || upper === undefined || lower === undefined || upper === lower) {
    return { label: '—', color: COLOR_MUTED }
  }
  const percentB = (close - lower) / (upper - lower)
  if (percentB >= 1) return { label: 'At/Above Upper Band', color: COLOR_RED }
  if (percentB >= 0.8) return { label: 'Near Upper Band', color: COLOR_ORANGE }
  if (percentB <= 0) return { label: 'At/Below Lower Band', color: COLOR_GREEN }
  if (percentB <= 0.2) return { label: 'Near Lower Band', color: COLOR_ORANGE }
  return { label: 'Inside Bands', color: COLOR_SECONDARY }
}

export function interpretVWAP(close: number | undefined, vwapValue: number | undefined): Interpretation {
  if (close === undefined || vwapValue === undefined || vwapValue === 0) {
    return { label: '—', color: COLOR_MUTED }
  }
  const pctDiff = ((close - vwapValue) / vwapValue) * 100
  if (Math.abs(pctDiff) < 0.05) return { label: 'At VWAP', color: COLOR_SECONDARY }
  if (pctDiff > 0) return { label: `${pctDiff.toFixed(1)}% Above VWAP`, color: COLOR_GREEN }
  return { label: `${Math.abs(pctDiff).toFixed(1)}% Below VWAP`, color: COLOR_RED }
}
