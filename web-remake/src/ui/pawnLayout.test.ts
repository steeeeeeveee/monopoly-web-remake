import { describe, expect, it } from 'vitest'
import { getPawnLayout } from './pawnLayout'

describe('棋子同格布局', () => {
  it('单个棋子占格子的百分之七十并居中', () => {
    expect(getPawnLayout(1, 0)).toEqual({
      sizePercent: 70,
      centerXPercent: 50,
      centerYPercent: 50,
    })
  })

  it('两个棋子缩小后左右排列', () => {
    const first = getPawnLayout(2, 0)
    const second = getPawnLayout(2, 1)

    expect(first.sizePercent).toBe(44)
    expect(second.sizePercent).toBe(44)
    expect(first.centerXPercent).toBeLessThan(50)
    expect(second.centerXPercent).toBeGreaterThan(50)
  })

  it('三至四个棋子使用二乘二预留布局', () => {
    const layouts = Array.from(
      { length: 4 },
      (_, index) => getPawnLayout(4, index),
    )

    expect(layouts.every((layout) => layout.sizePercent === 38))
      .toBe(true)
    expect(new Set(layouts.map((layout) => layout.centerXPercent)).size)
      .toBe(2)
    expect(new Set(layouts.map((layout) => layout.centerYPercent)).size)
      .toBe(2)
  })
})
