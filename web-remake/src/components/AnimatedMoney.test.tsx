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
    const positiveDelta = screen.getByText('+100')
    expect(positiveDelta).toHaveClass(
      'money-delta--positive',
    )
    expect(
      positiveDelta.style.getPropertyValue(
        '--money-delta-color',
      ),
    ).toBe('#5df0a4')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText('¥ 5100')).toBeInTheDocument()

    view.rerender(
      <AnimatedMoney value={5000} resetKey={0} />,
    )
    const negativeDelta = screen.getByText('-100')
    expect(negativeDelta).toHaveClass(
      'money-delta--negative',
    )
    expect(
      negativeDelta.style.getPropertyValue(
        '--money-delta-color',
      ),
    ).toBe('#ff6474')
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
