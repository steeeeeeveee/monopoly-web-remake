import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DiceView } from './DiceView'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('impact dice animation', () => {
  it('switches from rolling to the preloaded result without overlap', () => {
    vi.useFakeTimers()
    const onAnimationComplete = vi.fn()
    const { container } = render(
      <DiceView
        value={12}
        isRolling
        animationVariant="impact"
        onAnimationComplete={onAnimationComplete}
      />,
    )
    const dice = container.querySelector('.dice-view')
    const finalFace = () =>
      container.querySelector('[data-dice-layer="final"]')
    const rollingFace = () =>
      container.querySelector('[data-dice-layer="rolling"]')

    expect(dice).toHaveAttribute(
      'data-animation-phase',
      'anticipation',
    )
    expect(finalFace()).not.toBeInTheDocument()
    expect(rollingFace()).toBeInTheDocument()
    expect(container.querySelector('.crystal-die')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(100))
    expect(dice).toHaveAttribute(
      'data-animation-phase',
      'flight',
    )

    act(() => vi.advanceTimersByTime(520))
    expect(dice).toHaveAttribute(
      'data-animation-phase',
      'descent',
    )

    act(() => vi.advanceTimersByTime(139))
    expect(finalFace()).not.toBeInTheDocument()
    expect(rollingFace()).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    expect(dice).toHaveAttribute(
      'data-animation-phase',
      'impact',
    )
    expect(finalFace()).toBeInTheDocument()
    expect(rollingFace()).not.toBeInTheDocument()
    expect(onAnimationComplete).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(140))
    expect(onAnimationComplete).toHaveBeenCalledTimes(1)
    expect(dice).toHaveAttribute('data-animation-phase', 'idle')
  })

  it('cancels every timer when the animation is unmounted', () => {
    vi.useFakeTimers()
    const onAnimationComplete = vi.fn()
    const { unmount } = render(
      <DiceView
        value={6}
        isRolling
        animationVariant="impact"
        onAnimationComplete={onAnimationComplete}
      />,
    )

    act(() => vi.advanceTimersByTime(500))
    unmount()
    act(() => vi.advanceTimersByTime(500))

    expect(onAnimationComplete).not.toHaveBeenCalled()
  })

  it('skips decorative motion when reduced motion is enabled', () => {
    const onAnimationComplete = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }),
    )
    const { container } = render(
      <DiceView
        value={9}
        isRolling
        animationVariant="impact"
        onAnimationComplete={onAnimationComplete}
      />,
    )

    expect(
      container.querySelector('[data-dice-layer="rolling"]'),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('[data-dice-layer="final"]'),
    ).not.toHaveClass('dice-view__final-face--preloaded')
    expect(onAnimationComplete).toHaveBeenCalledTimes(1)
  })
})
