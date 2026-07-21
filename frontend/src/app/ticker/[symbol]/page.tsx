'use client'
import { useParams } from 'next/navigation'

export default function TickerPage() {
  const params = useParams()
  return <div>Ticker page for {params?.symbol}</div>
}
