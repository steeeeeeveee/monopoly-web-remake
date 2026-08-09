import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SHOP_AI_DELAY_MS,
  SHOP_ENTER_DURATION_MS,
  SHOP_EXIT_DURATION_MS,
  SHOP_SELECTION_DURATION_MS,
} from '../game/shop'
import { ShopModal } from './ShopModal'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function selectedCards(): HTMLElement[] {
  return screen
    .getAllByText(/炸弹|遥控骰子|蛛网/, {
      selector: '.shop-item-card strong',
    })
    .map((label) => label.closest('.shop-item-card'))
    .filter((card): card is HTMLElement => card !== null)
    .filter((card) => card.dataset.selected === 'true')
}

describe('商店选择流程', () => {
  it('真人确认后只高亮一个道具，退出完成才发奖', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const onAward = vi.fn()

    render(
      <ShopModal open isAI={false} onAward={onAward} />,
    )

    expect(selectedCards()).toHaveLength(0)
    const confirmButton = screen.getByRole('button', {
      name: '确认抽取',
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(confirmButton).toBeDisabled()
    expect(selectedCards()).toHaveLength(1)
    expect(selectedCards()[0]).toHaveAttribute(
      'data-item',
      'remote',
    )

    act(() => {
      vi.advanceTimersByTime(SHOP_SELECTION_DURATION_MS)
    })
    expect(onAward).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(SHOP_EXIT_DURATION_MS)
    })
    expect(onAward).toHaveBeenCalledTimes(1)
    expect(onAward).toHaveBeenCalledWith('remote')
  })

  it('电脑在弹窗稳定显示后自动完成相同流程', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const onAward = vi.fn()

    render(<ShopModal open isAI onAward={onAward} />)

    expect(
      screen.queryByRole('button', { name: '确认抽取' }),
    ).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(
        SHOP_ENTER_DURATION_MS + SHOP_AI_DELAY_MS - 1,
      )
    })
    expect(selectedCards()).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(selectedCards()[0]).toHaveAttribute(
      'data-item',
      'web',
    )

    act(() => {
      vi.advanceTimersByTime(
        SHOP_SELECTION_DURATION_MS + SHOP_EXIT_DURATION_MS,
      )
    })
    expect(onAward).toHaveBeenCalledOnce()
    expect(onAward).toHaveBeenCalledWith('web')
  })
})
