import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type Dispatch,
} from 'react'
import { boardTiles, type TileKind } from '../game/board'
import { MOVE_STEP_DURATION_MS } from '../game/constants'
import {
  getPropertyRent,
  getRent,
} from '../game/gameReducer'
import type {
  GameAction,
  GameState,
  Player,
  PlayerId,
} from '../game/types'
import {
  getBoardEffectDuration,
  type BoardEffect,
} from '../ui/boardEffects'
import { getPawnLayout } from '../ui/pawnLayout'
import { getHouseTier } from '../ui/visuals'
import {
  GameIcon,
  HouseIcon,
  PawnIcon,
} from './GameIcon'

interface BoardViewProps {
  state: GameState
  dispatch: Dispatch<GameAction>
  isDiceAnimating: boolean
  onMoveStepComplete: () => void
  boardEffect: BoardEffect | null
  onBoardEffectComplete: (effectId: number) => void
}

function getTileIcon(kind: TileKind) {
  if (kind === 'gold') return <GameIcon name="coin" />
  if (kind === 'shop') return <GameIcon name="shop" />
  if (kind === 'event') return <GameIcon name="event" />
  if (kind === 'jail') return <GameIcon name="jail" />
  if (kind === 'hospital') return <GameIcon name="hospital" />
  if (kind === 'start') return <GameIcon name="start" />
  return null
}

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches ?? false
  )
}

function getPlayersOnTile(
  players: Player[],
  tileIndex: number,
): Player[] {
  return players
    .filter(
      (player) =>
        !player.bankrupt && player.position === tileIndex,
    )
    .sort((left, right) => left.id - right.id)
}

function getPlayerLayout(
  players: Player[],
  playerId: PlayerId,
) {
  const player = players.find(
    (candidate) => candidate.id === playerId,
  )

  if (!player) return getPawnLayout(1, 0)

  const tilePlayers = getPlayersOnTile(
    players,
    player.position,
  )
  const playerIndex = Math.max(
    0,
    tilePlayers.findIndex(
      (candidate) => candidate.id === playerId,
    ),
  )

  return getPawnLayout(tilePlayers.length, playerIndex)
}

function pawnTitle(player: Player): string {
  if (!player.inJail) return `${player.name}的棋子`

  return player.position === 35
    ? `${player.name}的棋子，正在医院住院`
    : `${player.name}的棋子，正在监狱中`
}

interface PawnStatusBadgesProps {
  player: Player
  showMovingConfusion: boolean
}

function PawnStatusBadges({
  player,
  showMovingConfusion,
}: PawnStatusBadgesProps) {
  const showConfusion =
    player.confusedTurns > 0 || showMovingConfusion

  if (!showConfusion && !player.hasForcedAcquisition) {
    return null
  }

  return (
    <span className="pawn-status-badges" aria-hidden="true">
      {showConfusion && (
        <span className="pawn-status-badge pawn-status-badge--dizzy">
          <GameIcon name="dizzy" />
        </span>
      )}
      {player.hasForcedAcquisition && (
        <span className="pawn-status-badge pawn-status-badge--acquisition">
          <GameIcon name="acquisition" />
        </span>
      )}
    </span>
  )
}

function createJumpKeyframes(
  deltaX: number,
  deltaY: number,
  jumpHeight: number,
  targetScale: number,
): Keyframe[] {
  const transform = (
    travel: number,
    arc: number,
    scaleX: number,
    scaleY: number,
    rotation: number,
  ) => ({
    transform: `translate(-50%, -50%) translate(${deltaX * travel}px, ${
      deltaY * travel - arc
    }px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
  })
  const tilt = Math.abs(deltaX) >= Math.abs(deltaY)
    ? Math.sign(deltaX) || 1
    : -(Math.sign(deltaY) || 1)

  return [
    { ...transform(0, 0, 1, 1, 0), offset: 0 },
    {
      ...transform(0, 0, 1.1, 0.86, -tilt * 2),
      offset: 0.16,
    },
    {
      ...transform(
        0.32,
        jumpHeight * 0.86,
        0.97,
        1.07,
        tilt * 3.4,
      ),
      offset: 0.38,
    },
    {
      ...transform(
        0.68,
        jumpHeight * 0.86,
        0.96 * targetScale,
        1.08 * targetScale,
        tilt * 3.4,
      ),
      offset: 0.6,
    },
    {
      ...transform(
        1,
        0,
        targetScale,
        targetScale,
        0,
      ),
      offset: 0.82,
    },
    {
      ...transform(
        1,
        0,
        targetScale * 1.08,
        targetScale * 0.86,
        0,
      ),
      offset: 0.9,
    },
    {
      ...transform(
        1,
        0,
        targetScale,
        targetScale,
        0,
      ),
      offset: 1,
    },
  ]
}

export function BoardView({
  state,
  dispatch,
  isDiceAnimating,
  onMoveStepComplete,
  boardEffect,
  onBoardEffectComplete,
}: BoardViewProps) {
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  )
  const canPlace =
    state.phase === 'placingItem' &&
    !currentPlayer?.isAI
  const tileRefs = useRef(new Map<number, HTMLDivElement>())
  const pawnRefs = useRef(new Map<PlayerId, HTMLSpanElement>())
  const activeMoveKeyRef = useRef<string | null>(null)
  const moveAnimationsRef = useRef<Animation[]>([])
  const moveTimerRef = useRef<number | null>(null)
  const effectTimerRef = useRef<number | null>(null)

  const activePlayers = useMemo(
    () =>
      state.players.filter((player) => !player.bankrupt),
    [state.players],
  )

  useEffect(() => {
    if (
      state.phase !== 'moving' ||
      isDiceAnimating ||
      !currentPlayer ||
      state.movementQueue.length === 0
    ) {
      return
    }

    const nextPosition = state.movementQueue[0]
    if (nextPosition === undefined) return

    const moveKey = `${currentPlayer.id}:${currentPlayer.position}:${nextPosition}:${state.movementQueue.length}`
    if (activeMoveKeyRef.current === moveKey) return
    activeMoveKeyRef.current = moveKey

    const completeStep = () => {
      if (activeMoveKeyRef.current !== moveKey) return
      activeMoveKeyRef.current = null
      onMoveStepComplete()
    }

    if (prefersReducedMotion()) {
      moveTimerRef.current = window.setTimeout(completeStep, 0)
      return () => {
        if (moveTimerRef.current !== null) {
          window.clearTimeout(moveTimerRef.current)
          moveTimerRef.current = null
        }
        if (activeMoveKeyRef.current === moveKey) {
          activeMoveKeyRef.current = null
        }
      }
    }

    const movingPawn = pawnRefs.current.get(currentPlayer.id)
    const targetTile = tileRefs.current.get(nextPosition)

    if (!movingPawn || !targetTile || !movingPawn.animate) {
      moveTimerRef.current = window.setTimeout(
        completeStep,
        MOVE_STEP_DURATION_MS,
      )
      return () => {
        if (moveTimerRef.current !== null) {
          window.clearTimeout(moveTimerRef.current)
          moveTimerRef.current = null
        }
        if (activeMoveKeyRef.current === moveKey) {
          activeMoveKeyRef.current = null
        }
      }
    }

    const projectedPlayers = state.players.map((player) =>
      player.id === currentPlayer.id
        ? { ...player, position: nextPosition }
        : player,
    )
    const sourcePosition = currentPlayer.position
    const affectedPlayers = projectedPlayers.filter(
      (player) =>
        !player.bankrupt &&
        (player.id === currentPlayer.id ||
          player.position === nextPosition ||
          player.position === sourcePosition),
    )

    for (const player of affectedPlayers) {
      const pawn = pawnRefs.current.get(player.id)
      const destinationTile = tileRefs.current.get(
        player.position,
      )
      if (!pawn || !destinationTile) continue

      const pawnRect = pawn.getBoundingClientRect()
      const tileRect = destinationTile.getBoundingClientRect()
      const layout = getPlayerLayout(
        projectedPlayers,
        player.id,
      )
      const targetCenterX =
        tileRect.left +
        tileRect.width * (layout.centerXPercent / 100)
      const targetCenterY =
        tileRect.top +
        tileRect.height * (layout.centerYPercent / 100)
      const currentCenterX = pawnRect.left + pawnRect.width / 2
      const currentCenterY = pawnRect.top + pawnRect.height / 2
      const deltaX = targetCenterX - currentCenterX
      const deltaY = targetCenterY - currentCenterY
      const targetSize =
        Math.min(tileRect.width, tileRect.height) *
        (layout.sizePercent / 100)
      const targetScale = pawnRect.width > 0
        ? targetSize / pawnRect.width
        : 1

      const animation = player.id === currentPlayer.id
        ? pawn.animate(
            createJumpKeyframes(
              deltaX,
              deltaY,
              Math.min(tileRect.width, tileRect.height) * 0.55,
              targetScale,
            ),
            {
              duration: MOVE_STEP_DURATION_MS,
              easing: 'linear',
              fill: 'forwards',
            },
          )
        : pawn.animate(
            [
              {
                transform:
                  'translate(-50%, -50%) translate(0, 0) scale(1)',
              },
              {
                transform: `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${targetScale})`,
              },
            ],
            {
              duration: MOVE_STEP_DURATION_MS,
              easing: 'cubic-bezier(.22,.8,.35,1)',
              fill: 'forwards',
            },
          )

      moveAnimationsRef.current.push(animation)

      if (player.id === currentPlayer.id) {
        void animation.finished
          .then(completeStep)
          .catch(() => undefined)
      }
    }

    return () => {
      for (const animation of moveAnimationsRef.current) {
        animation.cancel()
      }
      moveAnimationsRef.current = []
      if (activeMoveKeyRef.current === moveKey) {
        activeMoveKeyRef.current = null
      }
    }
  }, [
    currentPlayer,
    isDiceAnimating,
    onMoveStepComplete,
    state.movementQueue,
    state.phase,
    state.players,
  ])

  useEffect(() => {
    if (!boardEffect) return

    const duration = getBoardEffectDuration(
      boardEffect,
      prefersReducedMotion(),
    )
    const effectId = boardEffect.id

    effectTimerRef.current = window.setTimeout(() => {
      effectTimerRef.current = null
      onBoardEffectComplete(effectId)
    }, duration)

    return () => {
      if (effectTimerRef.current !== null) {
        window.clearTimeout(effectTimerRef.current)
        effectTimerRef.current = null
      }
    }
  }, [boardEffect, onBoardEffectComplete])

  const effectTile = boardEffect
    ? boardTiles.find(
        (tile) => tile.index === boardEffect.tileIndex,
      )
    : null

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
        const isActiveWebTrap =
          boardEffect?.kind === 'webCapture' &&
          boardEffect.tileIndex === tile.index
        const isActiveBombTrap =
          boardEffect?.kind === 'explosion' &&
          boardEffect.source === 'trap' &&
          boardEffect.tileIndex === tile.index
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
            } ${placementBlocked ? 'board-tile--blocked' : ''} ${
              boardEffect?.tileIndex === tile.index
                ? 'board-tile--effect-target'
                : ''
            } ${
              boardEffect?.kind === 'explosion' &&
              boardEffect.tileIndex === tile.index
                ? 'board-tile--explosion-target'
                : ''
            }`}
            key={tile.index}
            ref={(element) => {
              if (element) tileRefs.current.set(tile.index, element)
              else tileRefs.current.delete(tile.index)
            }}
            data-tile-index={tile.index}
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
              <span className="tile-trap-layer">
                {tileEffect.hasWeb && !isActiveWebTrap && (
                  <span className="tile-trap tile-trap--web">
                    <GameIcon name="web" title="蛛网" />
                  </span>
                )}
                {tileEffect.hasBomb && !isActiveBombTrap && (
                  <span className="tile-trap tile-trap--bomb">
                    <GameIcon name="bomb" title="炸弹" />
                  </span>
                )}
              </span>
            )}
          </div>
        )
      })}

      <div className="board-center-mark" aria-hidden="true">
        <span>MONOPOLY</span>
        <strong>财富之路</strong>
        <small>52 TILE EDITION</small>
      </div>

      <div className="pawn-layer">
        {activePlayers.map((player) => {
          const tile = boardTiles[player.position]
          if (!tile) return null

          const layout = getPlayerLayout(
            state.players,
            player.id,
          )
          const style = {
            gridColumn: tile.column,
            gridRow: tile.row,
            '--pawn-size': `${layout.sizePercent}%`,
            '--pawn-x': `${layout.centerXPercent}%`,
            '--pawn-y': `${layout.centerYPercent}%`,
          } as CSSProperties
          const showMovingConfusion =
            state.phase === 'moving' &&
            state.currentPlayerId === player.id &&
            state.movementDirection === -1
          const isWebCaptureTarget =
            boardEffect?.kind === 'webCapture' &&
            boardEffect.playerId === player.id
          const isTrapExplosionTarget =
            boardEffect?.kind === 'explosion' &&
            boardEffect.source === 'trap' &&
            boardEffect.playerId === player.id

          return (
            <span
              className="pawn-slot"
              key={player.id}
              style={style}
            >
              <span
                className={`pawn-motion ${
                  isWebCaptureTarget
                    ? 'pawn-motion--web-captured'
                    : ''
                } ${
                  isTrapExplosionTarget
                    ? 'pawn-motion--explosion-target'
                    : ''
                }`}
                ref={(element) => {
                  if (element) {
                    pawnRefs.current.set(player.id, element)
                  } else {
                    pawnRefs.current.delete(player.id)
                  }
                }}
                data-player-id={player.id}
              >
                <PawnStatusBadges
                  player={player}
                  showMovingConfusion={showMovingConfusion}
                />
                <PawnIcon
                  color={player.color}
                  title={pawnTitle(player)}
                />
              </span>
            </span>
          )
        })}
      </div>

      {boardEffect && effectTile && (
        <div
          className="board-effect-layer"
          role="status"
          aria-label={
            boardEffect.kind === 'webCapture'
              ? '蛛网正在缠住玩家'
              : boardEffect.kind === 'eventBombDrop'
                ? '事件炸弹正在坠落'
                : boardEffect.source === 'event'
                  ? '炸弹正在摧毁地产'
                  : '玩家踩中的炸弹正在爆炸'
          }
        >
          {boardEffect.kind === 'webCapture' && (
            <span
              className="web-capture-effect"
              style={{
                gridColumn: effectTile.column,
                gridRow: effectTile.row,
              }}
            >
              <span className="web-capture-effect__net">
                <GameIcon name="web" />
              </span>
              {[-32, 24, 78, 138].map((angle) => (
                <span
                  className="web-capture-effect__strand"
                  key={angle}
                  style={{
                    '--strand-angle': `${angle}deg`,
                  } as CSSProperties}
                />
              ))}
              <span className="web-capture-effect__glint" />
            </span>
          )}

          {boardEffect.kind === 'eventBombDrop' && (
            <span
              className="event-bomb-drop"
              style={{
                gridColumn: effectTile.column,
                gridRow: effectTile.row,
              }}
            >
              <span className="event-bomb-drop__shadow" />
              <span className="event-bomb-drop__trail event-bomb-drop__trail--one" />
              <span className="event-bomb-drop__trail event-bomb-drop__trail--two" />
              <span className="event-bomb-drop__bomb">
                <GameIcon name="bomb" />
              </span>
            </span>
          )}

          {boardEffect.kind === 'explosion' && (
            <span
              className={`explosion-effect explosion-effect--${boardEffect.source}`}
              style={{
                gridColumn: effectTile.column,
                gridRow: effectTile.row,
              }}
            >
              <span className="explosion-effect__flash" />
              <span className="explosion-effect__fireball explosion-effect__fireball--outer" />
              <span className="explosion-effect__fireball explosion-effect__fireball--inner" />
              <span className="explosion-effect__ring explosion-effect__ring--one" />
              <span className="explosion-effect__ring explosion-effect__ring--two" />
              {Array.from({ length: 10 }, (_, index) => (
                <span
                  className="explosion-effect__spark"
                  key={`spark-${index}`}
                  style={{
                    '--spark-angle': `${index * 36}deg`,
                    '--spark-delay': `${index * 9}ms`,
                  } as CSSProperties}
                />
              ))}
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  className="explosion-effect__debris"
                  key={`debris-${index}`}
                  style={{
                    '--debris-angle': `${index * 60 + 18}deg`,
                    '--debris-delay': `${index * 12}ms`,
                  } as CSSProperties}
                />
              ))}
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  className={`explosion-effect__smoke explosion-effect__smoke--${index + 1}`}
                  key={`smoke-${index}`}
                />
              ))}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
