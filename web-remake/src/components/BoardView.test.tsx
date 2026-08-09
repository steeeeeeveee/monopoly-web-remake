import {
  act,
  cleanup,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialGameState } from '../game/gameReducer'
import type { GameState } from '../game/types'
import { BoardView } from './BoardView'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function renderBoard(
  state: GameState,
  options: {
    isDiceAnimating?: boolean
    onMoveStepComplete?: () => void
    onBoardEffectComplete?: (effectId: number) => void
  } = {},
) {
  return render(
    <BoardView
      state={state}
      dispatch={vi.fn()}
      isDiceAnimating={options.isDiceAnimating ?? false}
      onMoveStepComplete={
        options.onMoveStepComplete ?? vi.fn()
      }
      boardEffect={null}
      onBoardEffectComplete={
        options.onBoardEffectComplete ?? vi.fn()
      }
    />,
  )
}

describe('棋盘棋子层', () => {
  it('单个棋子使用百分之七十尺寸，同格后使用百分之四十四', () => {
    const separatedState: GameState = {
      ...createInitialGameState(),
      players: createInitialGameState().players.map((player) =>
        player.id === 1 ? { ...player, position: 1 } : player,
      ),
    }
    const view = renderBoard(separatedState)
    const singleSlot = screen
      .getByLabelText('玩家 1的棋子')
      .closest('.pawn-slot') as HTMLElement

    expect(singleSlot.style.getPropertyValue('--pawn-size'))
      .toBe('70%')

    view.rerender(
      <BoardView
        state={createInitialGameState()}
        dispatch={vi.fn()}
        isDiceAnimating={false}
        onMoveStepComplete={vi.fn()}
        boardEffect={null}
        onBoardEffectComplete={vi.fn()}
      />,
    )

    const sharedSlots = screen
      .getAllByLabelText(/的棋子/)
      .map((pawn) => pawn.closest('.pawn-slot') as HTMLElement)
    expect(
      sharedSlots.every(
        (slot) =>
          slot.style.getPropertyValue('--pawn-size') === '44%',
      ),
    ).toBe(true)
  })

  it('骰子动画结束后完成一跳才请求推进规则状态', () => {
    vi.useFakeTimers()
    const onMoveStepComplete = vi.fn()
    const movingState: GameState = {
      ...createInitialGameState(),
      phase: 'moving',
      movementQueue: [1],
      players: createInitialGameState().players.map((player) =>
        player.id === 1 ? { ...player, position: 2 } : player,
      ),
    }
    const view = renderBoard(movingState, {
      isDiceAnimating: true,
      onMoveStepComplete,
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onMoveStepComplete).not.toHaveBeenCalled()

    view.rerender(
      <BoardView
        state={movingState}
        dispatch={vi.fn()}
        isDiceAnimating={false}
        onMoveStepComplete={onMoveStepComplete}
        boardEffect={null}
        onBoardEffectComplete={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(279)
    })
    expect(onMoveStepComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onMoveStepComplete).toHaveBeenCalledTimes(1)
  })

  it('眩晕和收购状态显示在棋子上方', () => {
    const state: GameState = {
      ...createInitialGameState(),
      players: createInitialGameState().players.map((player) =>
        player.id === 0
          ? {
              ...player,
              confusedTurns: 1,
              hasForcedAcquisition: true,
            }
          : { ...player, position: 1 },
      ),
    }
    const { container } = renderBoard(state)

    expect(
      container.querySelectorAll('.pawn-status-badge'),
    ).toHaveLength(2)
    expect(
      container.querySelector('.pawn-status-badge--dizzy'),
    ).toBeInTheDocument()
    expect(
      container.querySelector(
        '.pawn-status-badge--acquisition',
      ),
    ).toBeInTheDocument()
  })

  it('陨石效果播放完成后才通知结算', () => {
    vi.useFakeTimers()
    const onBoardEffectComplete = vi.fn()
    const state = createInitialGameState()

    render(
      <BoardView
        state={state}
        dispatch={vi.fn()}
        isDiceAnimating={false}
        onMoveStepComplete={vi.fn()}
        boardEffect={{ id: 7, kind: 'meteor', tileIndex: 1 }}
        onBoardEffectComplete={onBoardEffectComplete}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(949)
    })
    expect(onBoardEffectComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onBoardEffectComplete).toHaveBeenCalledWith(7)
  })
})
