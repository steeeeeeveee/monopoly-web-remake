import { describe, expect, it } from 'vitest'
import {
  createEventExplosionSequence,
  createTrapEffectSequence,
  getBoardEffectDuration,
} from './boardEffects'

describe('棋盘动画序列', () => {
  it('事件炸房先坠弹再播放通用爆炸', () => {
    expect(createEventExplosionSequence(12)).toEqual([
      { kind: 'eventBombDrop', tileIndex: 12 },
      { kind: 'explosion', source: 'event', tileIndex: 12 },
    ])
  })

  it('同格蛛网和炸弹严格先蛛网后爆炸', () => {
    expect(
      createTrapEffectSequence(8, 1, true, true),
    ).toEqual([
      {
        kind: 'webCapture',
        tileIndex: 8,
        playerId: 1,
      },
      {
        kind: 'explosion',
        source: 'trap',
        tileIndex: 8,
        playerId: 1,
      },
    ])
  })

  it('道具炸弹序列没有坠落阶段', () => {
    expect(
      createTrapEffectSequence(8, 0, false, true),
    ).toEqual([
      {
        kind: 'explosion',
        source: 'trap',
        tileIndex: 8,
        playerId: 0,
      },
    ])
  })

  it('普通和减少动态效果使用正确时长', () => {
    expect(
      getBoardEffectDuration(
        { id: 1, kind: 'webCapture', tileIndex: 1, playerId: 0 },
        false,
      ),
    ).toBe(850)
    expect(
      getBoardEffectDuration(
        { id: 2, kind: 'eventBombDrop', tileIndex: 1 },
        true,
      ),
    ).toBe(0)
    expect(
      getBoardEffectDuration(
        { id: 3, kind: 'explosion', source: 'trap', tileIndex: 1 },
        true,
      ),
    ).toBe(160)
  })
})
