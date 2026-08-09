import type { RandomSource } from './constants'
import type { ItemType } from './types'

export const SHOP_ITEMS: readonly ItemType[] = [
  'bomb',
  'remote',
  'web',
]

export const SHOP_ENTER_DURATION_MS = 220
export const SHOP_SELECTION_DURATION_MS = 500
export const SHOP_EXIT_DURATION_MS = 180
export const SHOP_AI_DELAY_MS = 500

export function getRandomShopItem(
  random: RandomSource = Math.random,
): ItemType {
  const index = Math.min(
    SHOP_ITEMS.length - 1,
    Math.floor(random() * SHOP_ITEMS.length),
  )

  return SHOP_ITEMS[index] ?? 'bomb'
}
