import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  gameReducer,
} from './gameReducer'
import type { GameState } from './types'

function finishMovement(state: GameState): GameState {
  let nextState = state

  while (nextState.phase === 'moving') {
    nextState = gameReducer(nextState, {
      type: 'MOVE_ONE_STEP',
    })
  }

  return nextState
}

function rollAndFinish(
  state: GameState,
  value: number,
): GameState {
  const rollingState = gameReducer(state, {
    type: 'ROLL',
    value,
  })

  return finishMovement(rollingState)
}

describe('地产经济', () => {
  it('购买后扣除 1000 金币，并把地产设为 1 级', () => {
    let state = createInitialGameState()

    state = rollAndFinish(state, 2)

    expect(state.phase).toBe('awaitingDecision')
    expect(state.decision).toBe('buy')

    state = gameReducer(state, {
      type: 'BUY_PROPERTY',
    })

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    const property = state.properties.find(
      (item) => item.tileIndex === 2,
    )

    expect(playerOne?.money).toBe(4000)
    expect(property).toEqual({
      tileIndex: 2,
      ownerId: 0,
      level: 1,
    })
    expect(state.currentPlayerId).toBe(1)
  })

  it('落到对方 1 级地产后支付 500 金币租金', () => {
    let state = createInitialGameState()

    state = rollAndFinish(state, 2)
    state = gameReducer(state, {
      type: 'BUY_PROPERTY',
    })

    state = rollAndFinish(state, 2)

    const owner = state.players.find(
      (player) => player.id === 0,
    )

    const tenant = state.players.find(
      (player) => player.id === 1,
    )

    expect(owner?.money).toBe(4500)
    expect(tenant?.money).toBe(4500)
    expect(state.currentPlayerId).toBe(0)
    expect(state.phase).toBe('waitingForRoll')
    })

  it('自己的 1 级地产可以花费 500 金币升到 2 级', () => {
    let state = createInitialGameState()

    state = rollAndFinish(state, 2)
    state = gameReducer(state, {
      type: 'BUY_PROPERTY',
    })

    state = {
      ...state,
      currentPlayerId: 0,
      phase: 'waitingForRoll',
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 0,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 2)

    expect(state.phase).toBe('awaitingDecision')
    expect(state.decision).toBe('upgrade')

    state = gameReducer(state, {
      type: 'UPGRADE_PROPERTY',
    })

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    const property = state.properties.find(
      (item) => item.tileIndex === 2,
    )

    expect(playerOne?.money).toBe(3500)
    expect(property?.level).toBe(2)
    expect(state.currentPlayerId).toBe(1)
  })
})
describe('移动规则', () => {
  it('经过起点后获得 200 金币', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 50,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 2)

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    expect(playerOne?.position).toBe(0)
    expect(playerOne?.money).toBe(5200)
    expect(state.currentPlayerId).toBe(1)
  })
})
describe('规则层收尾', () => {
  it('资金不足 1000 时不能购买地产', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              money: 999,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 2)

    const stateBeforeBuying = state

    state = gameReducer(state, {
      type: 'BUY_PROPERTY',
    })

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    const property = state.properties.find(
      (item) => item.tileIndex === 2,
    )

    expect(state).toBe(stateBeforeBuying)
    expect(playerOne?.money).toBe(999)
    expect(property?.ownerId).toBeNull()
    expect(property?.level).toBe(0)
  })

  it('玩家破产后释放地产，并判定另一名玩家获胜', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      currentPlayerId: 1,
      players: state.players.map((player) =>
        player.id === 1
          ? {
              ...player,
              money: 1000,
              position: 0,
            }
          : player,
      ),
      properties: state.properties.map((property) => {
        if (property.tileIndex === 2) {
          return {
            ...property,
            ownerId: 0,
            level: 5,
          }
        }

        if (property.tileIndex === 4) {
          return {
            ...property,
            ownerId: 1,
            level: 2,
          }
        }

        return property
      }),
    }

    state = rollAndFinish(state, 2)

    const bankruptPlayer = state.players.find(
      (player) => player.id === 1,
    )

    const releasedProperty = state.properties.find(
      (property) => property.tileIndex === 4,
    )

    expect(bankruptPlayer?.money).toBe(-3000)
    expect(bankruptPlayer?.bankrupt).toBe(true)
    expect(releasedProperty?.ownerId).toBeNull()
    expect(releasedProperty?.level).toBe(0)
    expect(state.phase).toBe('gameOver')
    expect(state.winnerId).toBe(0)
  })

  it('游戏结束后不能继续执行游戏操作', () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'gameOver',
      winnerId: 0,
    }

    expect(
      gameReducer(state, {
        type: 'ROLL',
        value: 6,
      }),
    ).toBe(state)

    expect(
      gameReducer(state, {
        type: 'MOVE_ONE_STEP',
      }),
    ).toBe(state)

    expect(
      gameReducer(state, {
        type: 'BUY_PROPERTY',
      }),
    ).toBe(state)

    expect(
      gameReducer(state, {
        type: 'UPGRADE_PROPERTY',
      }),
    ).toBe(state)

    expect(
      gameReducer(state, {
        type: 'SKIP_PROPERTY',
      }),
    ).toBe(state)
  })

  it('重新开始后恢复完整初始状态', () => {
    let state = createInitialGameState()

    state = rollAndFinish(state, 2)
    state = gameReducer(state, {
      type: 'BUY_PROPERTY',
    })

    state = gameReducer(state, {
      type: 'RESET',
    })

    expect(state).toEqual(createInitialGameState())
  })
})