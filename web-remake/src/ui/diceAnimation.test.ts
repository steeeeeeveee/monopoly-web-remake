import { describe, expect, it } from 'vitest'
import { getDiceAnimationVariant } from './diceAnimation'

describe('dice animation variant', () => {
  it('only enables the experiment for the impact query value', () => {
    expect(
      getDiceAnimationVariant('?diceAnimation=impact'),
    ).toBe('impact')
    expect(
      getDiceAnimationVariant('?diceAnimation=unknown'),
    ).toBe('classic')
    expect(getDiceAnimationVariant('')).toBe('classic')
  })
})
