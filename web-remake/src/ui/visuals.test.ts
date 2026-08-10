import { describe, expect, it } from 'vitest'
import {
  getDiceFaceSource,
  getHouseTier,
  rollingDiceFrames,
} from './visuals'

describe('视觉素材映射', () => {
  it('把 1–12 映射到原作静态骰面', () => {
    expect(getDiceFaceSource(1)).toBe(
      '/game-assets/dice/11.png',
    )
    expect(getDiceFaceSource(6)).toBe(
      '/game-assets/dice/66.png',
    )
    expect(getDiceFaceSource(12)).toBe(
      '/game-assets/dice/1212.png',
    )
  })

  it('保留六张原作摇动序列帧', () => {
    expect(rollingDiceFrames).toHaveLength(6)
    expect(rollingDiceFrames[0]).toContain('rolling-1.png')
    expect(rollingDiceFrames[5]).toContain('rolling-6.png')
  })

  it('按规则把等级映射成三档房屋', () => {
    expect(getHouseTier(0)).toBeNull()
    expect(getHouseTier(1)).toBe('small')
    expect(getHouseTier(2)).toBe('small')
    expect(getHouseTier(3)).toBe('medium')
    expect(getHouseTier(4)).toBe('medium')
    expect(getHouseTier(5)).toBe('villa')
  })
})
