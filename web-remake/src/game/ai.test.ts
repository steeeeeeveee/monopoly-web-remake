import { describe, expect, it } from 'vitest'
import { getAIAction } from './ai'
import { createInitialGameState } from './gameReducer'
import type { GameState } from './types'

function createAITurnState(): GameState {
  return {
    ...createInitialGameState('ai'),
    currentPlayerId: 1,
  }
}

describe('电脑玩家', () => {
  it('会在自己的回合自动掷出合法骰子点数', () => {
    const action = getAIAction(
      createAITurnState(),
      () => 0.5,
    )

    expect(action).toEqual({
      type: 'ROLL',
      value: 4,
    })
  })

  it('资金足够时购买地产，资金不足时跳过', () => {
    const richState: GameState = {
      ...createAITurnState(),
      phase: 'awaitingDecision',
      decision: 'buy',
      players: createAITurnState().players.map(
        (player) =>
          player.id === 1
            ? { ...player, position: 1 }
            : player,
      ),
    }

    expect(getAIAction(richState)).toEqual({
      type: 'BUY_PROPERTY',
    })

    const poorState: GameState = {
      ...richState,
      players: richState.players.map((player) =>
        player.id === 1
          ? { ...player, money: 999 }
          : player,
      ),
    }

    expect(getAIAction(poorState)).toEqual({
      type: 'SKIP_PROPERTY',
    })
  })

  it('遇到随机事件时会自动选择真人玩家', () => {
    const state: GameState = {
      ...createAITurnState(),
      phase: 'awaitingEventTarget',
    }

    expect(getAIAction(state, () => 0.3)).toEqual({
      type: 'RESOLVE_RANDOM_EVENT',
      targetId: 0,
      event: 'confusion',
      propertyTileIndex: undefined,
    })
  })

  it('重新开始时保留当前游戏模式', () => {
    const state = createAITurnState()

    expect(state.players[1]?.isAI).toBe(true)
    expect(state.players[1]?.name).toBe('电脑玩家')
  })
})
