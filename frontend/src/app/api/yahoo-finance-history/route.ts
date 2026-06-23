import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticker  = searchParams.get('ticker')
  const period1 = searchParams.get('period1')
  const period2 = searchParams.get('period2')

  if (!ticker || !period1 || !period2) {
    return NextResponse.json(
      { error: 'Missing required params: ticker, period1, period2' },
      { status: 400 },
    )
  }

  const p1 = parseInt(period1, 10)
  const p2 = parseInt(period2, 10)

  if (isNaN(p1) || isNaN(p2) || p1 >= p2) {
    return NextResponse.json({ error: 'Invalid period1 or period2' }, { status: 400 })
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${p1}&period2=${p2}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!res.ok) {
      clearTimeout(timeout)
      return NextResponse.json(
        { error: `Yahoo Finance responded with ${res.status}` },
        { status: res.status },
      )
    }

    clearTimeout(timeout)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    clearTimeout(timeout)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return NextResponse.json(
      { error: isTimeout ? 'Yahoo Finance request timed out' : 'Failed to fetch from Yahoo Finance' },
      { status: 502 },
    )
  }
}
