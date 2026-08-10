import {
  useEffect,
  useRef,
  type Dispatch,
} from 'react'
import type {
  GameAction,
  GameState,
  ItemType,
  Player,
} from '../game/types'
import { DiceView } from './DiceView'
import { GameIcon } from './GameIcon'
import type { DiceAnimationVariant } from '../ui/diceAnimation'

interface ActionDockProps {
  state: GameState
  currentPlayer: Player
  dispatch: Dispatch<GameAction>
  onRoll: () => void
  onUseItem: (item: ItemType) => void
  isDiceAnimating: boolean
  onDiceAnimationComplete: () => void
  diceAnimationVariant: DiceAnimationVariant
}

export function ActionDock({
  state,
  currentPlayer,
  dispatch,
  onRoll,
  onUseItem,
  isDiceAnimating,
  onDiceAnimationComplete,
  diceAnimationVariant,
}: ActionDockProps) {
  const rollButtonRef = useRef<HTMLButtonElement>(null)
  const isAITurn = currentPlayer.isAI

  useEffect(() => {
    if (
      state.phase === 'waitingForRoll' &&
      !isAITurn
    ) {
      rollButtonRef.current?.focus()
    }
  }, [state.phase, state.currentPlayerId, isAITurn])

  const phaseMessage = (() => {
    if (state.phase === 'moving') return '棋子正在前进…'
    if (state.phase === 'resolvingTileEffect') {
      return '正在结算格子陷阱…'
    }
    if (state.phase === 'placingItem') {
      return `请选择一个格子放置${
        state.placementItem === 'bomb' ? '炸弹' : '蛛网'
      }`
    }
    if (state.phase === 'awaitingDecision') {
      return '需要确认本次地产操作'
    }
    if (state.phase === 'awaitingShop') {
      return '商店为你准备了一件随机道具'
    }
    if (state.phase === 'awaitingEventTarget') {
      return '随机事件正在等待目标'
    }
    if (state.phase === 'choosingRemoteDice') {
      return '请选择遥控骰子的点数'
    }
    if (state.phase === 'gameOver') return '本局已经结束'
    return isAITurn ? '电脑正在分析棋盘…' : '准备掷骰子'
  })()

  return (
    <section className="action-dock" aria-label="回合操作区">
      <div className="turn-summary" role="status" aria-live="polite">
        <span className="turn-summary__label">当前回合</span>
        <strong>{currentPlayer.name}</strong>
        <span>{phaseMessage}</span>
      </div>

      <DiceView
        value={state.diceValue}
        isRolling={isDiceAnimating}
        onAnimationComplete={onDiceAnimationComplete}
        animationVariant={diceAnimationVariant}
      />

      <div className="primary-actions">
        {!isAITurn && state.phase === 'waitingForRoll' && (
          <>
            <button
              ref={rollButtonRef}
              className="primary-button roll-button"
              type="button"
              aria-label="掷骰子"
              onClick={onRoll}
            >
              掷骰子
              <span className="shortcut-hint" aria-hidden="true">
                R
              </span>
            </button>

            <div className="item-actions" aria-label="使用道具">
              {currentPlayer.items.bomb > 0 && (
                <button
                  className="icon-action"
                  type="button"
                  onClick={() => onUseItem('bomb')}
                  title="使用炸弹"
                >
                  <GameIcon name="bomb" />
                  <span>×{currentPlayer.items.bomb}</span>
                </button>
              )}
              {currentPlayer.items.remote > 0 && (
                <button
                  className="icon-action"
                  type="button"
                  onClick={() => onUseItem('remote')}
                  title="使用遥控骰子"
                >
                  <GameIcon name="remote" />
                  <span>×{currentPlayer.items.remote}</span>
                </button>
              )}
              {currentPlayer.items.web > 0 && (
                <button
                  className="icon-action"
                  type="button"
                  onClick={() => onUseItem('web')}
                  title="使用蛛网"
                >
                  <GameIcon name="web" />
                  <span>×{currentPlayer.items.web}</span>
                </button>
              )}
            </div>
          </>
        )}

        {state.phase === 'moving' && (
          <button className="primary-button" type="button" disabled>
            移动中…
          </button>
        )}

        {state.phase === 'resolvingTileEffect' && (
          <button className="primary-button" type="button" disabled>
            陷阱触发中…
          </button>
        )}

        {!isAITurn && state.phase === 'placingItem' && (
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              dispatch({ type: 'CANCEL_ITEM_USE' })
            }
          >
            取消放置
          </button>
        )}

        {isAITurn &&
          state.phase !== 'moving' &&
          state.phase !== 'resolvingTileEffect' && (
            <div className="ai-thinking" aria-label="电脑思考中">
              <i />
              <i />
              <i />
            </div>
          )}
      </div>

      <ol className="activity-feed" aria-label="最近动态">
        {state.log.slice(0, 3).map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ol>
    </section>
  )
}
