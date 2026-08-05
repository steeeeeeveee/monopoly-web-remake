import type {
  GameAction,
  GameState,
  Player,
  PlayerId,
} from './types'

const BOARD_SIZE = 52
const STARTING_MONEY = 5000
const START_REWARD = 200

function createPlayers(): Player[] {
  return [
    {
      id: 0,
      name: '玩家 1',
      color: '#ff6b6b',
      money: STARTING_MONEY,
      position: 0,
      bankrupt: false,
    },
    {
      id: 1,
      name: '玩家 2',
      color: '#4dabf7',
      money: STARTING_MONEY,
      position: 0,
      bankrupt: false,
    },
  ]
}

export function createInitialGameState(): GameState {
  return {
    players: createPlayers(),
    currentPlayerId: 0,
    phase: 'waitingForRoll',
    diceValue: null,
    movementQueue: [],
    log: ['游戏开始，玩家 1 先掷骰。'],
  }
}

function getNextPlayerId(currentPlayerId: PlayerId): PlayerId {
  return currentPlayerId === 0 ? 1 : 0
}

export function gameReducer(
  state: GameState,
  action: GameAction,
): GameState {
  switch (action.type) {
    case 'ROLL': {
      if (state.phase !== 'waitingForRoll') {
        return state
      }

      if (
        !Number.isInteger(action.value) ||
        action.value < 1 ||
        action.value > 6
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) => player.id === state.currentPlayerId,
      )

      if (!currentPlayer) {
        return state
      }

      const movementQueue = Array.from(
        { length: action.value },
        (_, step) =>
          (currentPlayer.position + step + 1) % BOARD_SIZE,
      )

      return {
        ...state,
        phase: 'moving',
        diceValue: action.value,
        movementQueue,
        log: [
          `${currentPlayer.name} 掷出了 ${action.value} 点`,
          ...state.log,
        ].slice(0, 6),
      }
    }

    case 'MOVE_ONE_STEP': {
      if (
        state.phase !== 'moving' ||
        state.movementQueue.length === 0
      ) {
        return state
      }

      const nextPosition = state.movementQueue[0]

      if (nextPosition === undefined) {
        return state
      }

      const remainingQueue = state.movementQueue.slice(1)
      const passedStart = nextPosition === 0

      const players = state.players.map((player) => {
        if (player.id !== state.currentPlayerId) {
          return player
        }

        return {
          ...player,
          position: nextPosition,
          money:
            player.money + (passedStart ? START_REWARD : 0),
        }
      })

      const log = passedStart
        ? [
            `经过起点，获得 ${START_REWARD} 金币`,
            ...state.log,
          ].slice(0, 6)
        : state.log

      if (remainingQueue.length > 0) {
        return {
          ...state,
          players,
          movementQueue: remainingQueue,
          log,
        }
      }

      return {
        ...state,
        players,
        currentPlayerId: getNextPlayerId(state.currentPlayerId),
        phase: 'waitingForRoll',
        movementQueue: [],
        log: [
          `移动到了第 ${nextPosition} 格`,
          ...log,
        ].slice(0, 6),
      }
    }

    case 'RESET':
      return createInitialGameState()
  }
}