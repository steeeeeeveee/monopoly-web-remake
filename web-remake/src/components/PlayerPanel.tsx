interface PlayerPanelProps {
  name: string
  money: number
  color: string
  isActive: boolean
}

export function PlayerPanel({
  name,
  money,
  color,
  isActive,
}: PlayerPanelProps) {
  const className = isActive
    ? 'player-panel player-panel--active'
    : 'player-panel'

  return (
    <article className={className}>
      <div
        className="player-marker"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <h2>{name}</h2>
      <p>金币：{money}</p>
    </article>
  )
}