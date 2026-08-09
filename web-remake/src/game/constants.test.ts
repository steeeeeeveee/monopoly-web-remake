import { describe, expect, it } from 'vitest'
import {
  DICE_MAX,
  DICE_MIN,
  getRandomDiceValue,
} from './constants'

describe('骰子随机范围', () => {
  it('真人与电脑共用 1–12 的边界', () => {
    expect(getRandomDiceValue(() => 0)).toBe(DICE_MIN)
    expect(getRandomDiceValue(() => 0.999999)).toBe(
      DICE_MAX,
    )
  })
})
