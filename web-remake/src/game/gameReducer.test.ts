import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  gameReducer,
  getPropertyRent,
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

describe('金币与监狱', () => {
  it('落到金币格后获得对应奖励', () => {
    let state = createInitialGameState()

    state = rollAndFinish(state, 3)

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    expect(playerOne?.position).toBe(3)
    expect(playerOne?.money).toBe(5666)
    expect(state.currentPlayerId).toBe(1)
    expect(state.phase).toBe('waitingForRoll')
  })

  it('进入监狱后跳过下一回合并自动出狱', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 16,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 6)

    const jailedPlayer = state.players.find(
      (player) => player.id === 0,
    )

    expect(jailedPlayer?.position).toBe(22)
    expect(jailedPlayer?.inJail).toBe(true)
    expect(jailedPlayer?.jailTurnsLeft).toBe(1)
    expect(state.currentPlayerId).toBe(1)

    state = rollAndFinish(state, 3)

    const releasedPlayer = state.players.find(
      (player) => player.id === 0,
    )

    expect(releasedPlayer?.inJail).toBe(false)
    expect(releasedPlayer?.jailTurnsLeft).toBe(0)
    expect(state.currentPlayerId).toBe(1)
  })

  it('地产主人在监狱中时不收取租金', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      currentPlayerId: 1,
      players: state.players.map((player) => {
        if (player.id === 0) {
          return {
            ...player,
            inJail: true,
            jailTurnsLeft: 1,
          }
        }

        return {
          ...player,
          position: 0,
        }
      }),
      properties: state.properties.map((property) =>
        property.tileIndex === 2
          ? {
              ...property,
              ownerId: 0,
              level: 1,
            }
          : property,
      ),
    }

    state = rollAndFinish(state, 2)

    const owner = state.players.find(
      (player) => player.id === 0,
    )
    const tenant = state.players.find(
      (player) => player.id === 1,
    )

    expect(owner?.money).toBe(5000)
    expect(tenant?.money).toBe(5000)
    expect(owner?.inJail).toBe(false)
    expect(state.currentPlayerId).toBe(1)
  })
})

describe('商店与背包', () => {
  it('进入商店后抽取道具并加入当前玩家背包', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 10,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 3)

    expect(state.phase).toBe('awaitingShop')
    expect(state.currentPlayerId).toBe(0)

    state = gameReducer(state, {
      type: 'RECEIVE_SHOP_ITEM',
      item: 'web',
    })

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    expect(playerOne?.items).toEqual({
      bomb: 0,
      remote: 0,
      web: 1,
    })
    expect(state.phase).toBe('waitingForRoll')
    expect(state.currentPlayerId).toBe(1)
  })

  it('不在商店阶段时不能领取道具', () => {
    const state = createInitialGameState()

    const nextState = gameReducer(state, {
      type: 'RECEIVE_SHOP_ITEM',
      item: 'bomb',
    })

    expect(nextState).toBe(state)
  })
})

describe('道具使用', () => {
  it('遥控骰子消耗一个道具并按指定点数移动', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              items: {
                ...player.items,
                remote: 1,
              },
            }
          : player,
      ),
    }

    state = gameReducer(state, {
      type: 'START_REMOTE_DICE',
    })

    expect(state.phase).toBe('choosingRemoteDice')

    state = gameReducer(state, {
      type: 'USE_REMOTE_DICE',
      value: 4,
    })

    const playerOne = state.players.find(
      (player) => player.id === 0,
    )

    expect(playerOne?.items.remote).toBe(0)
    expect(state.diceValue).toBe(4)
    expect(state.movementQueue).toEqual([1, 2, 3, 4])

    state = finishMovement(state)

    expect(state.players[0]?.position).toBe(4)
    expect(state.phase).toBe('awaitingDecision')
  })

  it('放置的炸弹会把停在该格的玩家送往医院', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              items: {
                ...player.items,
                bomb: 1,
              },
            }
          : player,
      ),
    }

    state = gameReducer(state, {
      type: 'START_ITEM_PLACEMENT',
      item: 'bomb',
    })
    state = gameReducer(state, {
      type: 'PLACE_ITEM',
      tileIndex: 2,
    })

    expect(state.tileEffects[2]?.hasBomb).toBe(true)
    expect(state.players[0]?.items.bomb).toBe(0)

    state = {
      ...state,
      currentPlayerId: 1,
    }
    state = rollAndFinish(state, 2)

    const playerTwo = state.players.find(
      (player) => player.id === 1,
    )

    expect(playerTwo?.position).toBe(35)
    expect(playerTwo?.inJail).toBe(true)
    expect(playerTwo?.jailTurnsLeft).toBe(1)
    expect(state.tileEffects[2]?.hasBomb).toBe(false)
    expect(state.log[0]).toContain('第 35 格医院')
  })

  it('蛛网会在移动途中拦住玩家并在触发后消失', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              items: {
                ...player.items,
                web: 1,
              },
            }
          : player,
      ),
    }

    state = gameReducer(state, {
      type: 'START_ITEM_PLACEMENT',
      item: 'web',
    })
    state = gameReducer(state, {
      type: 'PLACE_ITEM',
      tileIndex: 2,
    })

    state = gameReducer(state, {
      type: 'ROLL',
      value: 6,
    })
    state = finishMovement(state)

    expect(state.players[0]?.position).toBe(2)
    expect(state.tileEffects[2]?.hasWeb).toBe(false)
    expect(state.movementQueue).toEqual([])
    expect(state.phase).toBe('awaitingDecision')
  })
})

describe('1–12 点骰子边界', () => {
  it.each([1, 12])('普通骰子接受点数 %s', (value) => {
    const state = createInitialGameState()
    const nextState = gameReducer(state, {
      type: 'ROLL',
      value,
    })

    expect(nextState.phase).toBe('moving')
    expect(nextState.movementQueue).toHaveLength(value)
  })

  it.each([0, 13])('普通骰子拒绝点数 %s', (value) => {
    const state = createInitialGameState()

    expect(
      gameReducer(state, { type: 'ROLL', value }),
    ).toBe(state)
  })

  it.each([1, 12])('遥控骰子接受点数 %s', (value) => {
    let state = createInitialGameState()
    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              items: { ...player.items, remote: 1 },
            }
          : player,
      ),
    }
    state = gameReducer(state, {
      type: 'START_REMOTE_DICE',
    })
    state = gameReducer(state, {
      type: 'USE_REMOTE_DICE',
      value,
    })

    expect(state.phase).toBe('moving')
    expect(state.movementQueue).toHaveLength(value)
  })

  it.each([0, 13])('遥控骰子拒绝点数 %s', (value) => {
    let state = createInitialGameState()
    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              items: { ...player.items, remote: 1 },
            }
          : player,
      ),
    }
    state = gameReducer(state, {
      type: 'START_REMOTE_DICE',
    })

    expect(
      gameReducer(state, {
        type: 'USE_REMOTE_DICE',
        value,
      }),
    ).toBe(state)
  })
})

describe('随机事件', () => {
  it('落到事件格后等待选择目标玩家', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 3,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 2)

    expect(state.players[0]?.position).toBe(5)
    expect(state.phase).toBe('awaitingEventTarget')
    expect(state.currentPlayerId).toBe(0)
  })

  it('陨石会释放目标玩家的一块地产', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      phase: 'awaitingEventTarget',
      properties: state.properties.map((property) =>
        property.tileIndex === 2
          ? {
              ...property,
              ownerId: 1,
              level: 3,
            }
          : property,
      ),
    }

    state = gameReducer(state, {
      type: 'RESOLVE_RANDOM_EVENT',
      targetId: 1,
      event: 'meteor',
      propertyTileIndex: 2,
    })

    const property = state.properties.find(
      (item) => item.tileIndex === 2,
    )

    expect(property?.ownerId).toBeNull()
    expect(property?.level).toBe(0)
    expect(state.currentPlayerId).toBe(1)
  })

  it('迷惑效果会让玩家下一回合反向移动', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      phase: 'awaitingEventTarget',
    }
    state = gameReducer(state, {
      type: 'RESOLVE_RANDOM_EVENT',
      targetId: 0,
      event: 'confusion',
    })

    expect(state.players[0]?.confusedTurns).toBe(1)

    state = {
      ...state,
      currentPlayerId: 0,
      phase: 'waitingForRoll',
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              position: 10,
            }
          : player,
      ),
    }
    state = rollAndFinish(state, 2)

    expect(state.players[0]?.position).toBe(8)
    expect(state.players[0]?.confusedTurns).toBe(0)
    expect(state.movementDirection).toBe(-1)
  })

  it('资产事件可以增加或减半目标玩家金币', () => {
    let doubleState = createInitialGameState()

    doubleState = {
      ...doubleState,
      phase: 'awaitingEventTarget',
    }
    doubleState = gameReducer(doubleState, {
      type: 'RESOLVE_RANDOM_EVENT',
      targetId: 1,
      event: 'moneyDouble',
    })

    expect(doubleState.players[1]?.money).toBe(10000)

    let halfState = createInitialGameState()

    halfState = {
      ...halfState,
      phase: 'awaitingEventTarget',
    }
    halfState = gameReducer(halfState, {
      type: 'RESOLVE_RANDOM_EVENT',
      targetId: 1,
      event: 'moneyHalf',
    })

    expect(halfState.players[1]?.money).toBe(2500)
  })

  it('强制收购权可以按地产总成本改变所有者', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      currentPlayerId: 0,
      properties: state.properties.map((property) =>
        property.tileIndex === 2
          ? {
              ...property,
              ownerId: 1,
              level: 2,
            }
          : property,
      ),
      players: state.players.map((player) =>
        player.id === 0
          ? {
              ...player,
              hasForcedAcquisition: true,
            }
          : player,
      ),
    }

    state = rollAndFinish(state, 2)

    expect(state.decision).toBe('acquire')
    expect(state.players[0]?.hasForcedAcquisition).toBe(false)

    state = gameReducer(state, {
      type: 'ACQUIRE_PROPERTY',
    })

    const property = state.properties.find(
      (item) => item.tileIndex === 2,
    )

    expect(property?.ownerId).toBe(0)
    expect(property?.level).toBe(2)
    expect(state.players[0]?.money).toBe(3500)
  })
})

describe('相邻地产加成', () => {
  it('同一玩家连续地产共享基础租金总和与连地奖励', () => {
    const initialState = createInitialGameState()
    const properties = initialState.properties.map(
      (property) => {
        if (property.tileIndex === 1) {
          return { ...property, ownerId: 0 as const, level: 1 }
        }

        if (property.tileIndex === 2) {
          return { ...property, ownerId: 0 as const, level: 2 }
        }

        if (property.tileIndex === 4) {
          return { ...property, ownerId: 0 as const, level: 5 }
        }

        return property
      },
    )
    const firstProperty = properties.find(
      (property) => property.tileIndex === 1,
    )
    const secondProperty = properties.find(
      (property) => property.tileIndex === 2,
    )
    const separatedProperty = properties.find(
      (property) => property.tileIndex === 4,
    )

    if (
      !firstProperty ||
      !secondProperty ||
      !separatedProperty
    ) {
      throw new Error('测试地产不存在')
    }

    expect(getPropertyRent(firstProperty, properties)).toBe(
      1700,
    )
    expect(getPropertyRent(secondProperty, properties)).toBe(
      1700,
    )
    expect(
      getPropertyRent(separatedProperty, properties),
    ).toBe(4000)
  })

  it('落在连续地产上会按加成后的租金转账', () => {
    let state = createInitialGameState()

    state = {
      ...state,
      properties: state.properties.map((property) =>
        property.tileIndex === 1 ||
        property.tileIndex === 2
          ? {
              ...property,
              ownerId: 1,
              level:
                property.tileIndex === 1 ? 1 : 2,
            }
          : property,
      ),
    }

    state = rollAndFinish(state, 2)

    expect(state.players[0]?.money).toBe(3300)
    expect(state.players[1]?.money).toBe(6700)
    expect(state.log[0]).toContain('支付 1700 金币租金')
  })
})
