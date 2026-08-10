import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialGameState } from '../game/gameReducer'
import type { GameState } from '../game/types'
import { GameShell } from './GameShell'

afterEach(cleanup)

describe('随机事件弹窗', () => {
  it('说明所有事件结果并使用真实的 5000 上限', () => {
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'awaitingEventTarget',
    }

    render(
      <GameShell
        state={state}
        dispatch={vi.fn()}
        onRoll={vi.fn()}
        onUseRemoteDice={vi.fn()}
        onAwardShopItem={vi.fn()}
        onResolveEvent={vi.fn()}
        onResetGame={vi.fn()}
        onReturnHome={vi.fn()}
        isDiceAnimating={false}
        onDiceAnimationComplete={vi.fn()}
        onMoveStepComplete={vi.fn()}
        boardEffect={null}
        onBoardEffectComplete={vi.fn()}
        gameSessionId={0}
        diceAnimationVariant="classic"
      />,
    )

    expect(screen.getByText('召唤炸弹摧毁目标的一块地产'))
      .toBeInTheDocument()
    expect(screen.getByText('迷惑玩家，使其下一回合反向移动'))
      .toBeInTheDocument()
    expect(
      screen.getByText('资产减半或增加，增加金额不超过 5000'),
    ).toBeInTheDocument()
    expect(screen.getByText('获得一次强制收购机会'))
      .toBeInTheDocument()
  })
})

describe('玩家面板道具操作', () => {
  it('只有当前真人玩家能从自己的面板使用道具', () => {
    const dispatch = vi.fn()
    const state = createInitialGameState()

    render(
      <GameShell
        state={state}
        dispatch={dispatch}
        onRoll={vi.fn()}
        onUseRemoteDice={vi.fn()}
        onAwardShopItem={vi.fn()}
        onResolveEvent={vi.fn()}
        onResetGame={vi.fn()}
        onReturnHome={vi.fn()}
        isDiceAnimating={false}
        onDiceAnimationComplete={vi.fn()}
        onMoveStepComplete={vi.fn()}
        boardEffect={null}
        onBoardEffectComplete={vi.fn()}
        gameSessionId={0}
        diceAnimationVariant="classic"
      />,
    )

    const currentBomb = screen.getByRole('button', {
      name: '玩家 1使用炸弹，剩余 10 个',
    })
    const currentRemote = screen.getByRole('button', {
      name: '玩家 1使用遥控骰子，剩余 10 个',
    })
    const currentWeb = screen.getByRole('button', {
      name: '玩家 1使用蛛网，剩余 10 个',
    })
    const otherBomb = screen.getByRole('button', {
      name: '玩家 2使用炸弹，剩余 10 个',
    })

    expect(currentBomb).toBeEnabled()
    expect(currentRemote).toBeEnabled()
    expect(currentWeb).toBeEnabled()
    expect(otherBomb).toBeDisabled()

    fireEvent.click(currentBomb)
    fireEvent.click(currentRemote)
    fireEvent.click(currentWeb)

    expect(dispatch).toHaveBeenCalledWith({
      type: 'START_ITEM_PLACEMENT',
      item: 'bomb',
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'START_REMOTE_DICE',
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'START_ITEM_PLACEMENT',
      item: 'web',
    })
  })
})
