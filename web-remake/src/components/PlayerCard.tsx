import type { CSSProperties } from 'react'
import type {
  ItemType,
  Player,
  PlayerInventory,
} from '../game/types'
import { AnimatedMoney } from './AnimatedMoney'
import { GameIcon, PawnIcon } from './GameIcon'

interface PlayerCardProps {
  player: Player
  propertyCount: number
  isActive: boolean
  moneyResetKey: number
  canUseItems: boolean
  onUseItem: (item: ItemType) => void
}

interface InventoryItemProps {
  type: keyof PlayerInventory
  count: number
  label: string
  playerName: string
  canUse: boolean
  onUse: (item: ItemType) => void
}

function InventoryItem({
  type,
  count,
  label,
  playerName,
  canUse,
  onUse,
}: InventoryItemProps) {
  const isEnabled = canUse && count > 0

  return (
    <button
      className={`inventory-chip ${
        isEnabled ? 'inventory-chip--usable' : ''
      }`}
      type="button"
      disabled={!isEnabled}
      aria-label={`${playerName}使用${label}，剩余 ${count} 个`}
      title={
        isEnabled
          ? `使用${label}`
          : `${label} ${count} 个`
      }
      onClick={() => onUse(type)}
    >
      <GameIcon name={type} />
      <span>{count}</span>
    </button>
  )
}

export function PlayerCard({
  player,
  propertyCount,
  isActive,
  moneyResetKey,
  canUseItems,
  onUseItem,
}: PlayerCardProps) {
  const statusText = player.bankrupt
    ? '已破产'
    : player.inJail
      ? player.position === 35
        ? `住院 ${player.jailTurnsLeft} 回合`
        : `监狱 ${player.jailTurnsLeft} 回合`
      : '状态正常'

  return (
    <article
      className={`player-card ${
        isActive ? 'player-card--active' : ''
      } ${player.bankrupt ? 'player-card--bankrupt' : ''} ${
        canUseItems ? 'player-card--items-usable' : ''
      }`}
      style={{
        '--player-color': player.color,
      } as CSSProperties}
      aria-label={`${player.name}，金币 ${player.money}，位置第 ${player.position} 格，${statusText}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <header className="player-card__header">
        <div className="player-avatar">
          <PawnIcon color={player.color} />
        </div>
        <div>
          <p className="player-kicker">
            {player.isAI ? '电脑控制' : '真人玩家'}
          </p>
          <h2>{player.name}</h2>
        </div>
        {isActive && (
          <span className="turn-badge">行动中</span>
        )}
      </header>

      <div className="player-stats">
        <div>
          <span>金币</span>
          <AnimatedMoney
            value={player.money}
            resetKey={moneyResetKey}
          />
        </div>
        <div>
          <span>位置</span>
          <strong>第 {player.position} 格</strong>
        </div>
        <div>
          <span>地产</span>
          <strong>{propertyCount} 块</strong>
        </div>
      </div>

      <div className="player-card__status">
        <span
          className={`status-dot ${
            player.inJail || player.bankrupt
              ? 'status-dot--warning'
              : ''
          }`}
        />
        {statusText}
      </div>

      <div className="inventory-row" aria-label="道具背包">
        <InventoryItem
          type="bomb"
          count={player.items.bomb}
          label="炸弹"
          playerName={player.name}
          canUse={canUseItems}
          onUse={onUseItem}
        />
        <InventoryItem
          type="remote"
          count={player.items.remote}
          label="遥控骰子"
          playerName={player.name}
          canUse={canUseItems}
          onUse={onUseItem}
        />
        <InventoryItem
          type="web"
          count={player.items.web}
          label="蛛网"
          playerName={player.name}
          canUse={canUseItems}
          onUse={onUseItem}
        />
      </div>

      {(player.confusedTurns > 0 ||
        player.hasForcedAcquisition) && (
        <div className="effect-list">
          {player.confusedTurns > 0 && (
            <span className="effect-pill effect-pill--negative">
              迷惑 ×{player.confusedTurns}
            </span>
          )}
          {player.hasForcedAcquisition && (
            <span className="effect-pill effect-pill--positive">
              强制收购权
            </span>
          )}
        </div>
      )}
    </article>
  )
}
