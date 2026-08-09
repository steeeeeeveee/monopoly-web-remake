import {
  act,
  cleanup,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimatedMoney } from './AnimatedMoney'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('金币动画', () => {
  it('滚动到新金额并显示真实正负差额', () => {
    vi.useFakeTimers()
    const view = render(
      <AnimatedMoney value={5000} resetKey={0} />,
    )

    expect(screen.getByText('¥ 5000')).toBeInTheDocument()
    expect(screen.queryByText('+5000')).not.toBeInTheDocument()

    view.rerender(
      <AnimatedMoney value={5100} resetKey={0} />,
    )
    expect(screen.getByText('+100')).toHaveClass(
      'money-delta--positive',
    )

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText('¥ 5100')).toBeInTheDocument()

    view.rerender(
      <AnimatedMoney value={5000} resetKey={0} />,
    )
    expect(screen.getByText('-100')).toHaveClass(
      'money-delta--negative',
    )
    expect(screen.getByText('+100')).toBeInTheDocument()
  })

  it('重新开始时直接同步金额且不误报差额', () => {
    vi.useFakeTimers()
    const view = render(
      <AnimatedMoney value={4000} resetKey={0} />,
    )

    view.rerender(
      <AnimatedMoney value={5000} resetKey={1} />,
    )

    expect(screen.getByText('¥ 5000')).toBeInTheDocument()
    expect(screen.queryByText('+1000')).not.toBeInTheDocument()
  })
})
