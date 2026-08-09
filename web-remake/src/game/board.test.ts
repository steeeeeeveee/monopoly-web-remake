import { describe, expect, it } from 'vitest'
import { boardTiles } from './board'

describe('棋盘功能格', () => {
  it('第 35 格是医院', () => {
    expect(boardTiles[35]).toMatchObject({
      index: 35,
      kind: 'hospital',
      label: '医院',
    })
  })
})
