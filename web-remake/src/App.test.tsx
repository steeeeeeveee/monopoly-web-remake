import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

async function enterLocalGame(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(
    screen.getByRole('button', {
      name: '双人同屏',
    }),
  )

  await screen.findByLabelText('大富翁棋盘')
}

describe('大富翁页面', () => {
  it('可以进入两名真人加两名 AI 的四人混战', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '四人混战',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'AI 1',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'AI 2',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('¥ 5000')).toHaveLength(4)
    expect(screen.getAllByText('电脑控制')).toHaveLength(2)
  })

  it('可以选择单人模式并创建电脑玩家', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '单人挑战电脑',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: '电脑玩家',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('电脑控制')).toBeInTheDocument()
  })

  it('从首页进入游戏后显示棋盘和两名玩家', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: '大富翁网页版',
      }),
    ).toBeInTheDocument()

    expect(
      screen.queryByLabelText('大富翁棋盘'),
    ).not.toBeInTheDocument()

    await enterLocalGame(user)

    expect(
      screen.getByLabelText('大富翁棋盘'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('¥ 5000')).toHaveLength(2)
    expect(screen.getAllByText('第 0 格')).toHaveLength(2)
    expect(
      screen.getByRole('button', {
        name: '掷骰子',
      }),
    ).toBeEnabled()
  })

  it('掷骰、移动、购买和重新开始的页面状态正确', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<App />)
    await enterLocalGame(user)

    await user.click(
      screen.getByRole('button', {
        name: '掷骰子',
      }),
    )

    expect(
      screen.getByRole('button', {
        name: '移动中…',
      }),
    ).toBeDisabled()

    const buyButton = await screen.findByRole(
      'button',
      { name: '确认购买' },
      { timeout: 2000 },
    )

    expect(buyButton).toBeEnabled()
    expect(
      screen.getByRole('button', {
        name: '暂时跳过',
      }),
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', {
        name: '掷骰子',
      }),
    ).not.toBeInTheDocument()

    await user.click(buyButton)

    expect(
      await screen.findByText('¥ 4000'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('¥ 5000')).toHaveLength(1)

    await user.click(
      screen.getByRole('button', {
        name: '重新开始',
      }),
    )

    expect(screen.getAllByText('¥ 5000')).toHaveLength(2)
    expect(screen.getAllByText('第 0 格')).toHaveLength(2)
  })

  it('支持 R 掷骰和 Escape 跳过', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<App />)
    await enterLocalGame(user)

    fireEvent.keyDown(window, {
      key: 'r',
      code: 'KeyR',
    })

    expect(
      screen.getByRole('button', {
        name: '移动中…',
      }),
    ).toBeDisabled()

    await screen.findByRole(
      'button',
      { name: '确认购买' },
      { timeout: 2000 },
    )

    fireEvent.keyDown(window, {
      key: 'Escape',
      code: 'Escape',
    })

    expect(
      screen.getByRole('button', {
        name: '掷骰子',
      }),
    ).toBeEnabled()
  })

  it('骰子动画结束前不会移动棋子', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<App />)
    fireEvent.click(
      screen.getByRole('button', { name: '双人同屏' }),
    )

    act(() => {
      vi.advanceTimersByTime(250)
    })

    fireEvent.click(
      screen.getByRole('button', { name: '掷骰子' }),
    )

    act(() => {
      vi.advanceTimersByTime(419)
    })
    expect(screen.getAllByText('第 0 格')).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    act(() => {
      vi.advanceTimersByTime(279)
    })
    expect(screen.getAllByText('第 0 格')).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText('第 1 格')).toBeInTheDocument()
  })
})

describe('焦点管理', () => {
  it('可以用键盘进入双人同屏模式', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.tab()

    expect(
      screen.getByRole('button', {
        name: '双人同屏',
      }),
    ).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(
      await screen.findByLabelText('大富翁棋盘'),
    ).toBeInTheDocument()
  })

  it('根据游戏阶段自动选中正确按钮', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<App />)
    await enterLocalGame(user)

    const rollButton = screen.getByRole('button', {
      name: '掷骰子',
    })

    expect(rollButton).toHaveFocus()

    await user.click(rollButton)

    const buyButton = await screen.findByRole(
      'button',
      { name: '确认购买' },
      { timeout: 2000 },
    )

    expect(buyButton).toHaveFocus()

    await user.click(buyButton)

    expect(
      screen.getByRole('button', {
        name: '掷骰子',
      }),
    ).toHaveFocus()
  })
})
