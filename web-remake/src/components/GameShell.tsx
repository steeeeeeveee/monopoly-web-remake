import type { Dispatch } from 'react'
import type {
  GameAction,
  GameState,
  ItemType,
  PlayerId,
} from '../game/types'
import { DICE_MAX, DICE_MIN } from '../game/constants'
import {
  getPropertyTotalCost,
  getUpgradeCost,
  PROPERTY_PRICE,
} from '../game/gameReducer'
import { ActionDock } from './ActionDock'
import { BoardView } from './BoardView'
import { GameIcon, PawnIcon } from './GameIcon'
import { GameModal } from './GameModal'
import { PlayerCard } from './PlayerCard'
import { ShopModal } from './ShopModal'

interface GameShellProps {
  state: GameState
  dispatch: Dispatch<GameAction>
  onRoll: () => void
  onUseRemoteDice: (value: number) => void
  onAwardShopItem: (item: ItemType) => void
  onResolveEvent: (playerId: PlayerId) => void
  onResetGame: () => void
  onReturnHome: () => void
  isDiceAnimating: boolean
  onDiceAnimationComplete: () => void
  gameSessionId: number
}

export function GameShell({
  state,
  dispatch,
  onRoll,
  onUseRemoteDice,
  onAwardShopItem,
  onResolveEvent,
  onResetGame,
  onReturnHome,
  isDiceAnimating,
  onDiceAnimationComplete,
  gameSessionId,
}: GameShellProps) {
  const playerOne = state.players[0]
  const playerTwo = state.players[1]
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  )

  if (!playerOne || !playerTwo || !currentPlayer) {
    return null
  }

  const currentProperty = state.properties.find(
    (property) =>
      property.tileIndex === currentPlayer.position,
  )
  const decisionCost = (() => {
    if (state.decision === 'buy') return PROPERTY_PRICE
    if (state.decision === 'acquire') {
      return getPropertyTotalCost(
        currentProperty?.level ?? 1,
      )
    }
    return getUpgradeCost(currentProperty?.level ?? 0)
  })()
  const canAfford = currentPlayer.money >= decisionCost
  const missingMoney = canAfford
    ? 0
    : decisionCost - currentPlayer.money
  const winner = state.players.find(
    (player) => player.id === state.winnerId,
  )
  const isHumanTurn = !currentPlayer.isAI

  function propertyCount(playerId: PlayerId) {
    return state.properties.filter(
      (property) => property.ownerId === playerId,
    ).length
  }

  function resetGame() {
    onResetGame()
  }

  function skipDecision() {
    dispatch({ type: 'SKIP_PROPERTY' })
  }

  const decisionTitle =
    state.decision === 'buy'
      ? '购入这块地产？'
      : state.decision === 'upgrade'
        ? '升级你的地产？'
        : '使用强制收购？'
  const decisionDescription =
    state.decision === 'buy'
      ? `支付 ${decisionCost} 金币，将第 ${currentPlayer.position} 格收入名下。`
      : state.decision === 'upgrade'
        ? `支付 ${decisionCost} 金币，提高第 ${currentPlayer.position} 格的租金。`
        : `支付 ${decisionCost} 金币，取得第 ${currentPlayer.position} 格的所有权。`
  const decisionAction =
    state.decision === 'buy'
      ? 'BUY_PROPERTY'
      : state.decision === 'upgrade'
        ? 'UPGRADE_PROPERTY'
        : 'ACQUIRE_PROPERTY'

  return (
    <main className="game-screen">
      <header className="game-topbar">
        <div className="brand-lockup">
          <span className="brand-mark">M</span>
          <div>
            <strong>大富翁网页版</strong>
            <span>
              {state.mode === 'ai'
                ? '单人挑战电脑'
                : '双人同屏'}
            </span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="text-button"
            type="button"
            onClick={resetGame}
          >
            重新开始
          </button>
          <button
            className="text-button"
            type="button"
            onClick={onReturnHome}
          >
            返回首页
          </button>
        </div>
      </header>

      <div className="game-layout">
        <PlayerCard
          player={playerOne}
          propertyCount={propertyCount(playerOne.id)}
          isActive={
            state.phase !== 'gameOver' &&
            state.currentPlayerId === playerOne.id
          }
          moneyResetKey={gameSessionId}
        />

        <div className="board-column">
          <BoardView state={state} dispatch={dispatch} />
          <ActionDock
            state={state}
            currentPlayer={currentPlayer}
            dispatch={dispatch}
            onRoll={onRoll}
            isDiceAnimating={isDiceAnimating}
            onDiceAnimationComplete={
              onDiceAnimationComplete
            }
          />
        </div>

        <PlayerCard
          player={playerTwo}
          propertyCount={propertyCount(playerTwo.id)}
          isActive={
            state.phase !== 'gameOver' &&
            state.currentPlayerId === playerTwo.id
          }
          moneyResetKey={gameSessionId}
        />
      </div>

      <GameModal
        open={
          isHumanTurn &&
          state.phase === 'awaitingDecision'
        }
        title={decisionTitle}
        description={decisionDescription}
        icon={
          <PawnIcon color={currentPlayer.color} />
        }
        onCancel={skipDecision}
        closeLabel="跳过本次地产操作"
        tone={canAfford ? 'default' : 'warning'}
        actions={
          <>
            <button
              className="primary-button"
              type="button"
              disabled={!canAfford}
              data-autofocus={canAfford ? true : undefined}
              onClick={() =>
                dispatch({ type: decisionAction })
              }
            >
              {state.decision === 'buy'
                ? '确认购买'
                : state.decision === 'upgrade'
                  ? '确认升级'
                  : '确认收购'}
            </button>
            <button
              className="secondary-button"
              type="button"
              data-autofocus={!canAfford ? true : undefined}
              onClick={skipDecision}
            >
              暂时跳过
            </button>
          </>
        }
      >
        {!canAfford && (
          <p className="modal-error" role="alert">
            金币不足，还差 {missingMoney}
          </p>
        )}
      </GameModal>

      <ShopModal
        open={state.phase === 'awaitingShop'}
        isAI={!isHumanTurn}
        onAward={onAwardShopItem}
      />

      <GameModal
        open={
          isHumanTurn &&
          state.phase === 'choosingRemoteDice'
        }
        title="选择遥控骰子点数"
        description="选择 1–12 中的一个数字，棋子将精确移动对应格数。"
        icon={<GameIcon name="remote" />}
        onCancel={() =>
          dispatch({ type: 'CANCEL_ITEM_USE' })
        }
        actions={
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              dispatch({ type: 'CANCEL_ITEM_USE' })
            }
          >
            取消
          </button>
        }
      >
        <div className="number-picker">
          {Array.from(
            { length: DICE_MAX - DICE_MIN + 1 },
            (_, index) => index + DICE_MIN,
          ).map((value) => (
            <button
              className="number-button"
              type="button"
              key={value}
              data-autofocus={value === 1 ? true : undefined}
              onClick={() => onUseRemoteDice(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </GameModal>

      <GameModal
        open={
          isHumanTurn &&
          state.phase === 'awaitingEventTarget'
        }
        title="随机事件降临"
        description="选择一名仍在游戏中的玩家承受随机事件。"
        icon={<GameIcon name="event" />}
      >
        <div className="event-target-list">
          {state.players
            .filter((player) => !player.bankrupt)
            .map((player, index) => (
              <button
                className="target-card"
                type="button"
                key={player.id}
                data-autofocus={index === 0 ? true : undefined}
                onClick={() => onResolveEvent(player.id)}
              >
                <PawnIcon color={player.color} />
                <span>{player.name}</span>
              </button>
            ))}
        </div>
      </GameModal>

      <GameModal
        open={state.phase === 'gameOver'}
        title="游戏结束"
        description={
          winner
            ? `${winner.name} 成为本局最后的胜利者！`
            : '本局没有产生获胜者。'
        }
        icon={
          winner ? (
            <PawnIcon color={winner.color} />
          ) : (
            <GameIcon name="coin" />
          )
        }
        tone="positive"
        actions={
          <>
            <button
              className="primary-button"
              type="button"
              data-autofocus
              onClick={resetGame}
            >
              再来一局
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onReturnHome}
            >
              返回首页
            </button>
          </>
        }
      />
    </main>
  )
}
