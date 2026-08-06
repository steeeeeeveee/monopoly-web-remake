import { boardTiles } from './board'
import type {
  GameAction,
  GameState,
  Player,
  PlayerId,
  PropertyState,
} from './types'

const BOARD_SIZE = 52
const STARTING_MONEY = 5000
const START_REWARD = 200
const BANKRUPTCY_LIMIT = -2000

export const PROPERTY_PRICE = 1000
export const MAX_PROPERTY_LEVEL = 5

const upgradeCosts: Record<number, number> = {
  1: 500,
  2: 750,
  3: 750,
  4: 1000,
}

const rents: Record<number, number> = {
  1: 500,
  2: 1000,
  3: 1500,
  4: 2250,
  5: 4000,
}

export function getUpgradeCost(level: number): number {
  return upgradeCosts[level] ?? 0
}

export function getRent(level: number): number {
  return rents[level] ?? 0
}

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

function createProperties(): PropertyState[] {
  return boardTiles
    .filter((tile) => tile.kind === 'property')
    .map((tile) => ({
      tileIndex: tile.index,
      ownerId: null,
      level: 0,
    }))
}

export function createInitialGameState(): GameState {
  return {
    players: createPlayers(),
    properties: createProperties(),
    currentPlayerId: 0,
    phase: 'waitingForRoll',
    decision: null,
    diceValue: null,
    movementQueue: [],
    log: ['游戏开始，玩家 1 先掷骰。'],
    winnerId: null,
  }
}

function getNextPlayerId(currentPlayerId: PlayerId): PlayerId {
  return currentPlayerId === 0 ? 1 : 0
}

function addLog(log: string[], message: string): string[] {
  return [message, ...log].slice(0, 6)
}

function finishTurn(state: GameState): GameState {
  if (state.phase === 'gameOver') {
    return state
  }

  return {
    ...state,
    currentPlayerId: getNextPlayerId(state.currentPlayerId),
    phase: 'waitingForRoll',
    decision: null,
    movementQueue: [],
  }
}

function applyBankruptcy(
  state: GameState,
  playerId: PlayerId,
): GameState {
  const bankruptPlayer = state.players.find(
    (player) => player.id === playerId,
  )

  if (
    !bankruptPlayer ||
    bankruptPlayer.money >= BANKRUPTCY_LIMIT
  ) {
    return state
  }

  const players = state.players.map((player) =>
    player.id === playerId
      ? {
          ...player,
          bankrupt: true,
        }
      : player,
  )

  const properties = state.properties.map((property) =>
    property.ownerId === playerId
      ? {
          ...property,
          ownerId: null,
          level: 0,
        }
      : property,
  )

  const alivePlayers = players.filter(
    (player) => !player.bankrupt,
  )

  const bankruptState: GameState = {
    ...state,
    players,
    properties,
    log: addLog(
      state.log,
      `${bankruptPlayer.name} 破产了`,
    ),
  }

  if (alivePlayers.length > 1) {
    return bankruptState
  }

  const winner = alivePlayers[0] ?? null

  return {
    ...bankruptState,
    phase: 'gameOver',
    decision: null,
    movementQueue: [],
    winnerId: winner?.id ?? null,
    log: addLog(
      bankruptState.log,
      winner
        ? `${winner.name} 获胜！`
        : '本局没有获胜者',
    ),
  }
}

function resolveLanding(state: GameState): GameState {
  const currentPlayer = state.players.find(
    (player) => player.id === state.currentPlayerId,
  )

  if (!currentPlayer) {
    return state
  }

  const tile = boardTiles.find(
    (boardTile) =>
      boardTile.index === currentPlayer.position,
  )

  if (!tile) {
    return finishTurn(state)
  }

  if (tile.kind !== 'property') {
    return finishTurn({
      ...state,
      log: addLog(
        state.log,
        `${currentPlayer.name} 停在${tile.label}格`,
      ),
    })
  }

  const property = state.properties.find(
    (item) => item.tileIndex === tile.index,
  )

  if (!property) {
    return finishTurn(state)
  }

  if (property.ownerId === null) {
    const canBuy =
      currentPlayer.money >= PROPERTY_PRICE

    return {
      ...state,
      phase: 'awaitingDecision',
      decision: 'buy',
      log: addLog(
        state.log,
        canBuy
          ? `是否花费 ${PROPERTY_PRICE} 金币购买第 ${tile.index} 格？`
          : '金币不足，无法购买这块地产',
      ),
    }
  }

  if (property.ownerId === currentPlayer.id) {
    if (property.level >= MAX_PROPERTY_LEVEL) {
      return finishTurn({
        ...state,
        log: addLog(
          state.log,
          `第 ${tile.index} 格已经达到最高等级`,
        ),
      })
    }

    const cost = getUpgradeCost(property.level)
    const canUpgrade = currentPlayer.money >= cost

    return {
      ...state,
      phase: 'awaitingDecision',
      decision: 'upgrade',
      log: addLog(
        state.log,
        canUpgrade
          ? `是否花费 ${cost} 金币升级第 ${tile.index} 格？`
          : '金币不足，无法升级这块地产',
      ),
    }
  }

  const owner = state.players.find(
    (player) => player.id === property.ownerId,
  )

  if (!owner) {
    return finishTurn(state)
  }

  const rent = getRent(property.level)

  const players = state.players.map((player) => {
    if (player.id === currentPlayer.id) {
      return {
        ...player,
        money: player.money - rent,
      }
    }

    if (player.id === owner.id) {
      return {
        ...player,
        money: player.money + rent,
      }
    }

    return player
  })

  const afterPayment: GameState = {
    ...state,
    players,
    log: addLog(
      state.log,
      `${currentPlayer.name} 向 ${owner.name} 支付 ${rent} 金币租金`,
    ),
  }

  const afterBankruptcy = applyBankruptcy(
    afterPayment,
    currentPlayer.id,
  )

  return afterBankruptcy.phase === 'gameOver'
    ? afterBankruptcy
    : finishTurn(afterBankruptcy)
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
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (!currentPlayer || currentPlayer.bankrupt) {
        return state
      }

      const movementQueue = Array.from(
        { length: action.value },
        (_, step) =>
          (currentPlayer.position + step + 1) %
          BOARD_SIZE,
      )

      return {
        ...state,
        phase: 'moving',
        decision: null,
        diceValue: action.value,
        movementQueue,
        log: addLog(
          state.log,
          `${currentPlayer.name} 掷出了 ${action.value} 点`,
        ),
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

      const remainingQueue =
        state.movementQueue.slice(1)
      const passedStart = nextPosition === 0

      const players = state.players.map((player) => {
        if (player.id !== state.currentPlayerId) {
          return player
        }

        return {
          ...player,
          position: nextPosition,
          money:
            player.money +
            (passedStart ? START_REWARD : 0),
        }
      })

      const movedState: GameState = {
        ...state,
        players,
        movementQueue: remainingQueue,
        log: passedStart
          ? addLog(
              state.log,
              `经过起点，获得 ${START_REWARD} 金币`,
            )
          : state.log,
      }

      if (remainingQueue.length > 0) {
        return movedState
      }

      return resolveLanding({
        ...movedState,
        log: addLog(
          movedState.log,
          `移动到了第 ${nextPosition} 格`,
        ),
      })
    }

    case 'BUY_PROPERTY': {
      if (
        state.phase !== 'awaitingDecision' ||
        state.decision !== 'buy'
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (!currentPlayer) {
        return state
      }

      const property = state.properties.find(
        (item) =>
          item.tileIndex === currentPlayer.position,
      )

      if (
        !property ||
        property.ownerId !== null ||
        currentPlayer.money < PROPERTY_PRICE
      ) {
        return state
      }

      const players = state.players.map((player) =>
        player.id === currentPlayer.id
          ? {
              ...player,
              money: player.money - PROPERTY_PRICE,
            }
          : player,
      )

      const properties = state.properties.map((item) =>
        item.tileIndex === property.tileIndex
          ? {
              ...item,
              ownerId: currentPlayer.id,
              level: 1,
            }
          : item,
      )

      return finishTurn({
        ...state,
        players,
        properties,
        log: addLog(
          state.log,
          `${currentPlayer.name} 购买了第 ${property.tileIndex} 格`,
        ),
      })
    }

    case 'UPGRADE_PROPERTY': {
      if (
        state.phase !== 'awaitingDecision' ||
        state.decision !== 'upgrade'
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (!currentPlayer) {
        return state
      }

      const property = state.properties.find(
        (item) =>
          item.tileIndex === currentPlayer.position,
      )

      if (
        !property ||
        property.ownerId !== currentPlayer.id ||
        property.level >= MAX_PROPERTY_LEVEL
      ) {
        return state
      }

      const cost = getUpgradeCost(property.level)

      if (currentPlayer.money < cost) {
        return state
      }

      const players = state.players.map((player) =>
        player.id === currentPlayer.id
          ? {
              ...player,
              money: player.money - cost,
            }
          : player,
      )

      const properties = state.properties.map((item) =>
        item.tileIndex === property.tileIndex
          ? {
              ...item,
              level: item.level + 1,
            }
          : item,
      )

      return finishTurn({
        ...state,
        players,
        properties,
        log: addLog(
          state.log,
          `${currentPlayer.name} 将第 ${property.tileIndex} 格升级到 ${property.level + 1} 级`,
        ),
      })
    }

    case 'SKIP_PROPERTY': {
      if (state.phase !== 'awaitingDecision') {
        return state
      }

      return finishTurn({
        ...state,
        log: addLog(state.log, '放弃本次操作'),
      })
    }

    case 'RESET':
      return createInitialGameState()
  }
}