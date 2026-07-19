export interface IndicatorCardData {
  label: string
  value: string
  interpretationLabel: string
  color: string
}

interface Props {
  cards: IndicatorCardData[]
}

export default function IndicatorSummaryCards({ cards }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
            {card.label}
          </div>
          <div className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
            {card.value}
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: card.color }}>
            {card.interpretationLabel}
          </div>
        </div>
      ))}
    </div>
  )
}
