import {
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
})

describe('大富翁页面', () => {
  it('可以选择单人模式并创建电脑玩家', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '单人挑战电脑',
      }),
    )

    expect(
      screen.getByRole('heading', {
        name: '电脑玩家',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('电脑控制'),
    ).toBeInTheDocument()
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

    await user.click(
      screen.getByRole('button', {
        name: '开始游戏',
      }),
    )

    expect(
      screen.getByLabelText('大富翁棋盘'),
    ).toBeInTheDocument()

    expect(
      screen.getAllByText('金币：5000'),
    ).toHaveLength(2)

    expect(
      screen.getAllByText('位置：第 0 格'),
    ).toHaveLength(2)

    expect(
      screen.getByRole('button', {
        name: '掷骰子',
      }),
    ).toBeEnabled()
  })

  it('掷骰、移动、购买和重新开始的页面状态正确', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.2)

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '开始游戏',
      }),
    )

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
      {
        name: '购买（1000）',
      },
      {
        timeout: 2000,
      },
    )

    expect(buyButton).toBeEnabled()

    expect(
      screen.getByRole('button', {
        name: '跳过',
      }),
    ).toBeEnabled()

    expect(
      screen.queryByRole('button', {
        name: '掷骰子',
      }),
    ).not.toBeInTheDocument()

    await user.click(buyButton)

    expect(
      screen.getByText('金币：4000'),
    ).toBeInTheDocument()

    expect(
      screen.getAllByText('金币：5000'),
    ).toHaveLength(1)

    await user.click(
      screen.getByRole('button', {
        name: '重新开始',
      }),
    )

    expect(
      screen.getAllByText('金币：5000'),
    ).toHaveLength(2)

    expect(
      screen.getAllByText('位置：第 0 格'),
    ).toHaveLength(2)
  })

  it('支持 R 掷骰和 Escape 跳过', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.2)

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '开始游戏',
      }),
    )

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
      {
        name: '购买（1000）',
      },
      {
        timeout: 2000,
      },
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
})

describe('焦点管理', () => {
  it('根据游戏阶段自动选中正确按钮', async () => {
    const user = userEvent.setup()

    vi.spyOn(Math, 'random').mockReturnValue(0.2)

    render(<App />)

    await user.click(
      screen.getByRole('button', {
        name: '开始游戏',
      }),
    )

    const rollButton = screen.getByRole('button', {
      name: '掷骰子',
    })

    expect(rollButton).toHaveFocus()

    await user.click(rollButton)

    const buyButton = await screen.findByRole(
      'button',
      {
        name: '购买（1000）',
      },
      {
        timeout: 2000,
      },
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
