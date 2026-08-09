import type { CSSProperties, Dispatch } from 'react'
import { boardTiles, type TileKind } from '../game/board'
import {
  getPropertyRent,
  getRent,
} from '../game/gameReducer'
import type {
  GameAction,
  GameState,
} from '../game/types'
import { getHouseTier } from '../ui/visuals'
import {
  GameIcon,
  HouseIcon,
  PawnIcon,
} from './GameIcon'

interface BoardViewProps {
  state: GameState
  dispatch: Dispatch<GameAction>
}

function getTileIcon(kind: TileKind) {
  if (kind === 'gold') return <GameIcon name="coin" />
  if (kind === 'shop') return <GameIcon name="shop" />
  if (kind === 'event') return <GameIcon name="event" />
  if (kind === 'jail') return <GameIcon name="jail" />
  if (kind === 'function') return <GameIcon name="hospital" />
  if (kind === 'start') return <GameIcon name="start" />
  return null
}

export function BoardView({
  state,
  dispatch,
}: BoardViewProps) {
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  )
  const canPlace =
    state.phase === 'placingItem' &&
    !currentPlayer?.isAI

  return (
    <section className="game-board" aria-label="大富翁棋盘">
      {boardTiles.map((tile) => {
        const property = state.properties.find(
          (item) => item.tileIndex === tile.index,
        )
        const owner = state.players.find(
          (player) => player.id === property?.ownerId,
        )
        const tileEffect = state.tileEffects.find(
          (effect) => effect.tileIndex === tile.index,
        )
        const placementBlocked =
          (state.placementItem === 'bomb' &&
            tileEffect?.hasBomb) ||
          (state.placementItem === 'web' &&
            tileEffect?.hasWeb)
        const rent = property
          ? getPropertyRent(property, state.properties)
          : 0
        const hasNeighborBonus = Boolean(
          property &&
            property.ownerId !== null &&
            rent > getRent(property.level),
        )
        const houseTier = property
          ? getHouseTier(property.level)
          : null
        const title = owner
          ? `第 ${tile.index} 格，${owner.name}的 ${property?.level} 级地产，租金 ${rent}`
          : `第 ${tile.index} 格，${tile.label}`
        const tileStyle = {
          gridColumn: tile.column,
          gridRow: tile.row,
          '--owner-color': owner?.color ?? 'transparent',
        } as CSSProperties

        function placeItem() {
          dispatch({
            type: 'PLACE_ITEM',
            tileIndex: tile.index,
          })
        }

        return (
          <div
            className={`board-tile board-tile--${tile.kind} ${
              owner ? 'board-tile--owned' : ''
            } ${hasNeighborBonus ? 'board-tile--linked' : ''} ${
              canPlace ? 'board-tile--selectable' : ''
            } ${placementBlocked ? 'board-tile--blocked' : ''}`}
            key={tile.index}
            style={tileStyle}
            title={title}
            role={canPlace ? 'button' : undefined}
            tabIndex={canPlace && !placementBlocked ? 0 : undefined}
            onClick={
              canPlace && !placementBlocked
                ? placeItem
                : undefined
            }
            onKeyDown={(event) => {
              if (
                canPlace &&
                !placementBlocked &&
                (event.key === 'Enter' || event.key === ' ')
              ) {
                event.preventDefault()
                placeItem()
              }
            }}
          >
            <span className="tile-index">
              {tile.kind === 'property' ? tile.index : tile.label}
            </span>
            <span className="tile-main-icon">
              {getTileIcon(tile.kind)}
              {houseTier && owner && (
                <HouseIcon
                  tier={houseTier}
                  color={owner.color}
                />
              )}
            </span>
            {tile.kind === 'gold' && tile.reward && (
              <span className="tile-reward">{tile.reward}</span>
            )}
            {property && property.level > 0 && (
              <span className="tile-level">L{property.level}</span>
            )}
            {hasNeighborBonus && (
              <span
                className="tile-link-badge"
                aria-label="相邻地产租金加成"
              >
                连
              </span>
            )}
            {(tileEffect?.hasBomb ||
              tileEffect?.hasWeb) && (
              <span className="tile-effect-icons">
                {tileEffect.hasBomb && (
                  <GameIcon name="bomb" title="炸弹" />
                )}
                {tileEffect.hasWeb && (
                  <GameIcon name="web" title="蛛网" />
                )}
              </span>
            )}

            <span className="tile-pieces">
              {state.players
                .filter(
                  (player) =>
                    !player.bankrupt &&
                    player.position === tile.index,
                )
                .map((player) => (
                  <PawnIcon
                    key={player.id}
                    color={player.color}
                    title={`${player.name}的棋子${
                      player.inJail ? '，正在监狱中' : ''
                    }`}
                  />
                ))}
            </span>
          </div>
        )
      })}

      <div className="board-center-mark" aria-hidden="true">
        <span>MONOPOLY</span>
        <strong>财富之路</strong>
        <small>52 TILE EDITION</small>
      </div>
    </section>
  )
}
