import {
  getPropertyTotalCost,
  getUpgradeCost,
  PROPERTY_PRICE,
} from './gameReducer'
import { getRandomDiceValue } from './constants'
import { createRandomEventAction } from './events'
import type {
  GameAction,
  GameState,
  ItemType,
} from './types'

type RandomSource = () => number

const shopItems: ItemType[] = [
  'bomb',
  'remote',
  'web',
]

function chooseIndex(
  length: number,
  random: RandomSource,
): number {
  return Math.min(
    length - 1,
    Math.floor(random() * length),
  )
}

export function getAIAction(
  state: GameState,
  random: RandomSource = Math.random,
): GameAction | null {
  const player = state.players.find(
    (candidate) =>
      candidate.id === state.currentPlayerId,
  )

  if (!player?.isAI || player.bankrupt) {
    return null
  }

  if (state.phase === 'waitingForRoll') {
    const availableItems: ItemType[] = shopItems.filter(
      (item) => player.items[item] > 0,
    )

    if (availableItems.length > 0 && random() < 0.05) {
      const item =
        availableItems[
          chooseIndex(availableItems.length, random)
        ]

      if (item === 'remote') {
        return { type: 'START_REMOTE_DICE' }
      }

      if (item === 'bomb' || item === 'web') {
        return {
          type: 'START_ITEM_PLACEMENT',
          item,
        }
      }
    }

    return {
      type: 'ROLL',
      value: getRandomDiceValue(random),
    }
  }

  if (state.phase === 'choosingRemoteDice') {
    return {
      type: 'USE_REMOTE_DICE',
      value: getRandomDiceValue(random),
    }
  }

  if (
    state.phase === 'placingItem' &&
    state.placementItem
  ) {
    const availableTiles = state.tileEffects.filter(
      (effect) =>
        state.placementItem === 'bomb'
          ? !effect.hasBomb
          : !effect.hasWeb,
    )

    if (availableTiles.length === 0) {
      return { type: 'CANCEL_ITEM_USE' }
    }

    const tile =
      availableTiles[
        chooseIndex(availableTiles.length, random)
      ]

    return tile
      ? {
          type: 'PLACE_ITEM',
          tileIndex: tile.tileIndex,
        }
      : { type: 'CANCEL_ITEM_USE' }
  }

  if (state.phase === 'awaitingDecision') {
    const property = state.properties.find(
      (candidate) =>
        candidate.tileIndex === player.position,
    )

    if (state.decision === 'buy') {
      return player.money >= PROPERTY_PRICE
        ? { type: 'BUY_PROPERTY' }
        : { type: 'SKIP_PROPERTY' }
    }

    if (state.decision === 'upgrade' && property) {
      return player.money >= getUpgradeCost(property.level)
        ? { type: 'UPGRADE_PROPERTY' }
        : { type: 'SKIP_PROPERTY' }
    }

    if (state.decision === 'acquire' && property) {
      return player.money >=
        getPropertyTotalCost(property.level)
        ? { type: 'ACQUIRE_PROPERTY' }
        : { type: 'SKIP_PROPERTY' }
    }

    return { type: 'SKIP_PROPERTY' }
  }

  if (state.phase === 'awaitingEventTarget') {
    const target =
      state.players.find(
        (candidate) =>
          !candidate.bankrupt && !candidate.isAI,
      ) ?? player

    return createRandomEventAction(
      state,
      target.id,
      random,
    )
  }

  return null
}
