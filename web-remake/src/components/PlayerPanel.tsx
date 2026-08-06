interface PlayerPanelProps {
  name: string
  money: number
  position: number
  color: string
  isActive: boolean
}

export function PlayerPanel({
  name,
  money,
  position,
  color,
  isActive,
}: PlayerPanelProps) {
  const className = isActive
    ? 'player-panel player-panel--active'
    : 'player-panel'

  return (
    <article
      className={className}
      aria-label={`${name}，金币 ${money}，位置第 ${position} 格`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div
        className="player-marker"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <h2>{name}</h2>
      <p>金币：{money}</p>
      <p>位置：第 {position} 格</p>
    </article>
  )
}
