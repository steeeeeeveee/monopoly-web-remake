import { boardTiles } from './board'
import { DICE_MAX, DICE_MIN } from './constants'
import type {
  GameAction,
  GameMode,
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

export function getPropertyRent(
  property: PropertyState,
  properties: PropertyState[],
): number {
  if (property.ownerId === null) {
    return 0
  }

  const propertiesByIndex = new Map(
    properties.map((item) => [item.tileIndex, item]),
  )
  const connectedProperties = [property]

  for (
    let tileIndex = property.tileIndex - 1;
    propertiesByIndex.get(tileIndex)?.ownerId ===
    property.ownerId;
    tileIndex -= 1
  ) {
    const previousProperty =
      propertiesByIndex.get(tileIndex)

    if (previousProperty) {
      connectedProperties.unshift(previousProperty)
    }
  }

  for (
    let tileIndex = property.tileIndex + 1;
    propertiesByIndex.get(tileIndex)?.ownerId ===
    property.ownerId;
    tileIndex += 1
  ) {
    const nextProperty = propertiesByIndex.get(tileIndex)

    if (nextProperty) {
      connectedProperties.push(nextProperty)
    }
  }

  if (connectedProperties.length < 2) {
    return getRent(property.level)
  }

  const baseRentTotal = connectedProperties.reduce(
    (total, item) => total + getRent(item.level),
    0,
  )

  return (
    baseRentTotal + connectedProperties.length * 100
  )
}

export function getPropertyTotalCost(level: number): number {
  let totalCost = PROPERTY_PRICE

  for (
    let currentLevel = 1;
    currentLevel < level;
    currentLevel += 1
  ) {
    totalCost += getUpgradeCost(currentLevel)
  }

  return totalCost
}

function createPlayers(mode: GameMode): Player[] {
  return [
    {
      id: 0,
      name: '玩家 1',
      color: '#ff6b6b',
      money: STARTING_MONEY,
      position: 0,
      bankrupt: false,
      inJail: false,
      jailTurnsLeft: 0,
      items: {
        bomb: 0,
        remote: 0,
        web: 0,
      },
      confusedTurns: 0,
      hasForcedAcquisition: false,
      isAI: false,
    },
    {
      id: 1,
      name: mode === 'ai' ? '电脑玩家' : '玩家 2',
      color: '#4dabf7',
      money: STARTING_MONEY,
      position: 0,
      bankrupt: false,
      inJail: false,
      jailTurnsLeft: 0,
      items: {
        bomb: 0,
        remote: 0,
        web: 0,
      },
      confusedTurns: 0,
      hasForcedAcquisition: false,
      isAI: mode === 'ai',
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

function createTileEffects() {
  return boardTiles.map((tile) => ({
    tileIndex: tile.index,
    hasBomb: false,
    hasWeb: false,
  }))
}

export function createInitialGameState(
  mode: GameMode = 'local',
): GameState {
  return {
    mode,
    players: createPlayers(mode),
    properties: createProperties(),
    tileEffects: createTileEffects(),
    currentPlayerId: 0,
    phase: 'waitingForRoll',
    decision: null,
    diceValue: null,
    movementQueue: [],
    movementDirection: 1,
    log: ['游戏开始，玩家 1 先掷骰。'],
    winnerId: null,
    placementItem: null,
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

  let players = state.players
  let log = state.log
  let nextPlayerId = getNextPlayerId(
    state.currentPlayerId,
  )

  for (
    let checkedPlayers = 0;
    checkedPlayers < players.length;
    checkedPlayers += 1
  ) {
    const nextPlayer = players.find(
      (player) => player.id === nextPlayerId,
    )

    if (!nextPlayer || nextPlayer.bankrupt) {
      nextPlayerId = getNextPlayerId(nextPlayerId)
      continue
    }

    if (
      !nextPlayer.inJail ||
      nextPlayer.jailTurnsLeft <= 0
    ) {
      break
    }

    const remainingTurns =
      nextPlayer.jailTurnsLeft - 1

    players = players.map((player) =>
      player.id === nextPlayer.id
        ? {
            ...player,
            inJail: remainingTurns > 0,
            jailTurnsLeft: remainingTurns,
          }
        : player,
    )

    const isHospitalized = nextPlayer.position === 35
    log = addLog(
      log,
      isHospitalized
        ? `${nextPlayer.name} 正在医院休养，跳过本回合后出院`
        : remainingTurns > 0
          ? `${nextPlayer.name} 在监狱中，跳过本回合`
          : `${nextPlayer.name} 在监狱中跳过本回合，现已出狱`,
    )

    nextPlayerId = getNextPlayerId(nextPlayerId)
  }

  return {
    ...state,
    players,
    currentPlayerId: nextPlayerId,
    phase: 'waitingForRoll',
    decision: null,
    movementQueue: [],
    movementDirection: 1,
    log,
    placementItem: null,
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
          inJail: false,
          jailTurnsLeft: 0,
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
    movementDirection: 1,
    winnerId: winner?.id ?? null,
    placementItem: null,
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

  const tileEffect = state.tileEffects.find(
    (effect) => effect.tileIndex === tile.index,
  )

  if (tileEffect?.hasBomb) {
    const tileEffects = state.tileEffects.map((effect) =>
      effect.tileIndex === tile.index
        ? {
            ...effect,
            hasBomb: false,
          }
        : effect,
    )

    const players = state.players.map((player) =>
      player.id === currentPlayer.id
        ? {
            ...player,
            position: 35,
            inJail: true,
            jailTurnsLeft: 1,
          }
        : player,
    )

    return finishTurn({
      ...state,
      players,
      tileEffects,
      log: addLog(
        state.log,
        `${currentPlayer.name} 踩到炸弹，被送往第 35 格医院并住院一回合`,
      ),
    })
  }

  if (tile.kind === 'gold') {
    const reward = tile.reward ?? 0
    const players = state.players.map((player) =>
      player.id === currentPlayer.id
        ? {
            ...player,
            money: player.money + reward,
          }
        : player,
    )

    return finishTurn({
      ...state,
      players,
      log: addLog(
        state.log,
        `${currentPlayer.name} 获得 ${reward} 金币`,
      ),
    })
  }

  if (tile.kind === 'jail') {
    const players = state.players.map((player) =>
      player.id === currentPlayer.id
        ? {
            ...player,
            inJail: true,
            jailTurnsLeft: 1,
          }
        : player,
    )

    return finishTurn({
      ...state,
      players,
      log: addLog(
        state.log,
        `${currentPlayer.name} 进入监狱，下回合暂停一次`,
      ),
    })
  }

  if (tile.kind === 'shop') {
    return {
      ...state,
      phase: 'awaitingShop',
      decision: null,
      log: addLog(
        state.log,
        `${currentPlayer.name} 进入商店，可以免费抽取一件道具`,
      ),
    }
  }

  if (tile.kind === 'event') {
    return {
      ...state,
      phase: 'awaitingEventTarget',
      decision: null,
      log: addLog(
        state.log,
        `${currentPlayer.name} 触发随机事件，请选择目标玩家`,
      ),
    }
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

  if (currentPlayer.hasForcedAcquisition) {
    const acquisitionCost = getPropertyTotalCost(
      property.level,
    )
    const players = state.players.map((player) =>
      player.id === currentPlayer.id
        ? {
            ...player,
            hasForcedAcquisition: false,
          }
        : player,
    )

    return {
      ...state,
      players,
      phase: 'awaitingDecision',
      decision: 'acquire',
      log: addLog(
        state.log,
        currentPlayer.money >= acquisitionCost
          ? `是否花费 ${acquisitionCost} 金币强制收购第 ${property.tileIndex} 格？`
          : '资金不足，无法强制收购，可以跳过并正常结算租金',
      ),
    }
  }

  if (owner.inJail) {
    return finishTurn({
      ...state,
      log: addLog(
        state.log,
        owner.position === 35
          ? `${owner.name} 正在医院住院，本次不收租金`
          : `${owner.name} 正在监狱中，本次不收租金`,
      ),
    })
  }

  const rent = getPropertyRent(
    property,
    state.properties,
  )

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
        action.value < DICE_MIN ||
        action.value > DICE_MAX
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (
        !currentPlayer ||
        currentPlayer.bankrupt ||
        currentPlayer.inJail
      ) {
        return state
      }

      const movementDirection: 1 | -1 =
        currentPlayer.confusedTurns > 0 ? -1 : 1

      const players = state.players.map((player) =>
        player.id === currentPlayer.id &&
        movementDirection === -1
          ? {
              ...player,
              confusedTurns: Math.max(
                0,
                player.confusedTurns - 1,
              ),
            }
          : player,
      )

      const movementQueue = Array.from(
        { length: action.value },
        (_, step) =>
          (currentPlayer.position +
            movementDirection * (step + 1) +
            BOARD_SIZE) %
          BOARD_SIZE,
      )

      return {
        ...state,
        players,
        phase: 'moving',
        decision: null,
        diceValue: action.value,
        movementQueue,
        movementDirection,
        log: addLog(
          state.log,
          movementDirection === -1
            ? `${currentPlayer.name} 受到迷惑，反向移动 ${action.value} 格`
            : `${currentPlayer.name} 掷出了 ${action.value} 点`,
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
      const passedStart =
        nextPosition === 0 &&
        state.movementDirection === 1

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

      const tileEffect = state.tileEffects.find(
        (effect) =>
          effect.tileIndex === nextPosition,
      )

      if (tileEffect?.hasWeb) {
        const tileEffects = state.tileEffects.map(
          (effect) =>
            effect.tileIndex === nextPosition
              ? {
                  ...effect,
                  hasWeb: false,
                }
              : effect,
        )

        return resolveLanding({
          ...movedState,
          tileEffects,
          movementQueue: [],
          log: addLog(
            movedState.log,
            `${state.players[state.currentPlayerId]?.name ?? '玩家'} 被蛛网拦住，停在第 ${nextPosition} 格`,
          ),
        })
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

      if (state.decision === 'acquire') {
        return resolveLanding({
          ...state,
          decision: null,
        })
      }

      return finishTurn({
        ...state,
        log: addLog(state.log, '放弃本次操作'),
      })
    }

    case 'RECEIVE_SHOP_ITEM': {
      if (state.phase !== 'awaitingShop') {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      const currentTile = boardTiles.find(
        (tile) =>
          tile.index === currentPlayer?.position,
      )

      if (!currentPlayer || currentTile?.kind !== 'shop') {
        return state
      }

      const players = state.players.map((player) =>
        player.id === currentPlayer.id
          ? {
              ...player,
              items: {
                ...player.items,
                [action.item]:
                  player.items[action.item] + 1,
              },
            }
          : player,
      )

      const itemNames = {
        bomb: '炸弹',
        remote: '遥控骰子',
        web: '蛛网',
      }

      return finishTurn({
        ...state,
        players,
        log: addLog(
          state.log,
          `${currentPlayer.name} 获得了${itemNames[action.item]}`,
        ),
      })
    }

    case 'START_ITEM_PLACEMENT': {
      if (state.phase !== 'waitingForRoll') {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (
        !currentPlayer ||
        currentPlayer.items[action.item] <= 0
      ) {
        return state
      }

      return {
        ...state,
        phase: 'placingItem',
        placementItem: action.item,
        log: addLog(
          state.log,
          action.item === 'bomb'
            ? '请选择放置炸弹的格子'
            : '请选择放置蛛网的格子',
        ),
      }
    }

    case 'PLACE_ITEM': {
      if (
        state.phase !== 'placingItem' ||
        state.placementItem === null
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )
      const tileEffect = state.tileEffects.find(
        (effect) =>
          effect.tileIndex === action.tileIndex,
      )
      const item = state.placementItem

      if (
        !currentPlayer ||
        !tileEffect ||
        currentPlayer.items[item] <= 0 ||
        (item === 'bomb' && tileEffect.hasBomb) ||
        (item === 'web' && tileEffect.hasWeb)
      ) {
        return state
      }

      const players = state.players.map((player) =>
        player.id === currentPlayer.id
          ? {
              ...player,
              items: {
                ...player.items,
                [item]: player.items[item] - 1,
              },
            }
          : player,
      )

      const tileEffects = state.tileEffects.map(
        (effect) =>
          effect.tileIndex === action.tileIndex
            ? {
                ...effect,
                hasBomb:
                  item === 'bomb'
                    ? true
                    : effect.hasBomb,
                hasWeb:
                  item === 'web'
                    ? true
                    : effect.hasWeb,
              }
            : effect,
      )

      return {
        ...state,
        players,
        tileEffects,
        phase: 'waitingForRoll',
        placementItem: null,
        log: addLog(
          state.log,
          `${currentPlayer.name} 在第 ${action.tileIndex} 格放置了${
            item === 'bomb' ? '炸弹' : '蛛网'
          }`,
        ),
      }
    }

    case 'START_REMOTE_DICE': {
      if (state.phase !== 'waitingForRoll') {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (!currentPlayer || currentPlayer.items.remote <= 0) {
        return state
      }

      return {
        ...state,
        phase: 'choosingRemoteDice',
        log: addLog(
          state.log,
          '请选择遥控骰子的点数',
        ),
      }
    }

    case 'USE_REMOTE_DICE': {
      if (
        state.phase !== 'choosingRemoteDice' ||
        !Number.isInteger(action.value) ||
        action.value < DICE_MIN ||
        action.value > DICE_MAX
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )

      if (!currentPlayer || currentPlayer.items.remote <= 0) {
        return state
      }

      const movementDirection: 1 | -1 =
        currentPlayer.confusedTurns > 0 ? -1 : 1

      const players = state.players.map((player) =>
        player.id === currentPlayer.id
          ? {
              ...player,
              items: {
                ...player.items,
                remote: player.items.remote - 1,
              },
              confusedTurns:
                movementDirection === -1
                  ? Math.max(0, player.confusedTurns - 1)
                  : player.confusedTurns,
            }
          : player,
      )

      const movementQueue = Array.from(
        { length: action.value },
        (_, step) =>
          (currentPlayer.position +
            movementDirection * (step + 1) +
            BOARD_SIZE) %
          BOARD_SIZE,
      )

      return {
        ...state,
        players,
        phase: 'moving',
        diceValue: action.value,
        movementQueue,
        movementDirection,
        log: addLog(
          state.log,
          movementDirection === -1
            ? `${currentPlayer.name} 使用遥控骰子并反向移动 ${action.value} 格`
            : `${currentPlayer.name} 使用遥控骰子选择了 ${action.value} 点`,
        ),
      }
    }

    case 'CANCEL_ITEM_USE': {
      if (
        state.phase !== 'placingItem' &&
        state.phase !== 'choosingRemoteDice'
      ) {
        return state
      }

      return {
        ...state,
        phase: 'waitingForRoll',
        placementItem: null,
        log: addLog(state.log, '取消使用道具'),
      }
    }

    case 'RESOLVE_RANDOM_EVENT': {
      if (state.phase !== 'awaitingEventTarget') {
        return state
      }

      const target = state.players.find(
        (player) => player.id === action.targetId,
      )

      if (!target || target.bankrupt) {
        return state
      }

      if (action.event === 'meteor') {
        const targetProperty = state.properties.find(
          (property) =>
            property.tileIndex === action.propertyTileIndex &&
            property.ownerId === target.id,
        )

        if (!targetProperty) {
          return finishTurn({
            ...state,
            log: addLog(
              state.log,
              `${target.name} 没有可被陨石摧毁的地产`,
            ),
          })
        }

        const properties = state.properties.map(
          (property) =>
            property.tileIndex === targetProperty.tileIndex
              ? {
                  ...property,
                  ownerId: null,
                  level: 0,
                }
              : property,
        )

        return finishTurn({
          ...state,
          properties,
          log: addLog(
            state.log,
            `陨石摧毁了${target.name}的第 ${targetProperty.tileIndex} 格地产`,
          ),
        })
      }

      if (action.event === 'confusion') {
        const players = state.players.map((player) =>
          player.id === target.id
            ? {
                ...player,
                confusedTurns: player.confusedTurns + 1,
              }
            : player,
        )

        return finishTurn({
          ...state,
          players,
          log: addLog(
            state.log,
            `${target.name} 被迷惑，下一回合将反向移动`,
          ),
        })
      }

      if (
        action.event === 'moneyDouble' ||
        action.event === 'moneyHalf'
      ) {
        const newMoney =
          action.event === 'moneyDouble'
            ? target.money + Math.min(target.money, 5000)
            : Math.floor(target.money * 0.5)
        const players = state.players.map((player) =>
          player.id === target.id
            ? {
                ...player,
                money: newMoney,
              }
            : player,
        )

        return finishTurn({
          ...state,
          players,
          log: addLog(
            state.log,
            action.event === 'moneyDouble'
              ? `${target.name} 的资产增加到 ${newMoney} 金币`
              : `${target.name} 的资产减半为 ${newMoney} 金币`,
          ),
        })
      }

      const players = state.players.map((player) =>
        player.id === target.id
          ? {
              ...player,
              hasForcedAcquisition: true,
            }
          : player,
      )

      return finishTurn({
        ...state,
        players,
        log: addLog(
          state.log,
          `${target.name} 获得一次强制收购权`,
        ),
      })
    }

    case 'ACQUIRE_PROPERTY': {
      if (
        state.phase !== 'awaitingDecision' ||
        state.decision !== 'acquire'
      ) {
        return state
      }

      const currentPlayer = state.players.find(
        (player) =>
          player.id === state.currentPlayerId,
      )
      const property = state.properties.find(
        (item) =>
          item.tileIndex === currentPlayer?.position,
      )

      if (
        !currentPlayer ||
        !property ||
        property.ownerId === null ||
        property.ownerId === currentPlayer.id
      ) {
        return state
      }

      const cost = getPropertyTotalCost(property.level)

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
              ownerId: currentPlayer.id,
            }
          : item,
      )

      return finishTurn({
        ...state,
        players,
        properties,
        log: addLog(
          state.log,
          `${currentPlayer.name} 花费 ${cost} 金币强制收购了第 ${property.tileIndex} 格`,
        ),
      })
    }

    case 'RESET':
      return createInitialGameState(action.mode ?? state.mode)
  }
}
