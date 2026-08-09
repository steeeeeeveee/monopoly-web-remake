import type { PlayerInventory } from '../game/types'

interface PlayerPanelProps {
  name: string
  money: number
  position: number
  color: string
  isActive: boolean
  inJail: boolean
  jailTurnsLeft: number
  items: PlayerInventory
  confusedTurns: number
  hasForcedAcquisition: boolean
  isAI: boolean
}

export function PlayerPanel({
  name,
  money,
  position,
  color,
  isActive,
  inJail,
  jailTurnsLeft,
  items,
  confusedTurns,
  hasForcedAcquisition,
  isAI,
}: PlayerPanelProps) {
  const className = isActive
    ? 'player-panel player-panel--active'
    : 'player-panel'

  return (
    <article
      className={className}
      aria-label={`${name}，金币 ${money}，位置第 ${position} 格，${
        inJail ? '正在监狱中' : '状态正常'
      }，炸弹 ${items.bomb}，遥控骰子 ${items.remote}，蛛网 ${items.web}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div
        className="player-marker"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <h2>{name}</h2>
      {isAI && <p className="player-type">电脑控制</p>}
      <p>金币：{money}</p>
      <p>位置：第 {position} 格</p>
      <p
        className={
          inJail
            ? 'player-status player-status--jailed'
            : 'player-status'
        }
      >
        状态：
        {inJail
          ? `监狱（剩余 ${jailTurnsLeft} 回合）`
          : '正常'}
      </p>
      <p className="player-items">
        道具：炸弹 {items.bomb} · 遥控 {items.remote} ·
        蛛网 {items.web}
      </p>
      {confusedTurns > 0 && (
        <p className="player-effect player-effect--negative">
          迷惑：剩余 {confusedTurns} 回合
        </p>
      )}
      {hasForcedAcquisition && (
        <p className="player-effect player-effect--positive">
          拥有一次强制收购权
        </p>
      )}
    </article>
  )
}
