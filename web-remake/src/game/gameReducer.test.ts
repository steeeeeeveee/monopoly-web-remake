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

describe('地产购买', () => {
  it('购买后扣除 1000 金币，并把地产设为 1 级', () => {
    let state = createInitialGameState()

    state = gameReducer(state, {
      type: 'ROLL',
      value: 2,
    })

    state = finishMovement(state)

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
})