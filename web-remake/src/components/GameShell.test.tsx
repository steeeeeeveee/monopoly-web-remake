import { cleanup, render, screen } from '@testing-library/react'
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
