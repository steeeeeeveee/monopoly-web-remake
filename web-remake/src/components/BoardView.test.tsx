import {
  act,
  cleanup,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialGameState } from '../game/gameReducer'
import type { GameState } from '../game/types'
import type { BoardEffect } from '../ui/boardEffects'
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
    boardEffect?: BoardEffect | null
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
      boardEffect={options.boardEffect ?? null}
      onBoardEffectComplete={
        options.onBoardEffectComplete ?? vi.fn()
      }
    />,
  )
}

describe('棋盘棋子层', () => {
  it('单个棋子使用百分之八十尺寸，同格后使用百分之四十四', () => {
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
      .toBe('80%')

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

  it('事件坠弹阶段持续 420ms 后才通知进入爆炸', () => {
    vi.useFakeTimers()
    const onBoardEffectComplete = vi.fn()
    const state = createInitialGameState()

    render(
      <BoardView
        state={state}
        dispatch={vi.fn()}
        isDiceAnimating={false}
        onMoveStepComplete={vi.fn()}
        boardEffect={{
          id: 7,
          kind: 'eventBombDrop',
          tileIndex: 1,
        }}
        onBoardEffectComplete={onBoardEffectComplete}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(419)
    })
    expect(onBoardEffectComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onBoardEffectComplete).toHaveBeenCalledWith(7)
  })

  it('道具炸弹只显示通用爆炸且持续 800ms', () => {
    vi.useFakeTimers()
    const onBoardEffectComplete = vi.fn()
    const { container } = renderBoard(
      createInitialGameState(),
      {
        boardEffect: {
          id: 8,
          kind: 'explosion',
          source: 'trap',
          tileIndex: 0,
          playerId: 0,
        },
        onBoardEffectComplete,
      },
    )

    expect(container.querySelector('.explosion-effect'))
      .toBeInTheDocument()
    expect(container.querySelector('.event-bomb-drop'))
      .not.toBeInTheDocument()
    expect(container.querySelectorAll('.explosion-effect__spark'))
      .toHaveLength(10)

    act(() => {
      vi.advanceTimersByTime(799)
    })
    expect(onBoardEffectComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onBoardEffectComplete).toHaveBeenCalledWith(8)
  })

  it('蛛网捕获覆盖棋子并持续 850ms', () => {
    vi.useFakeTimers()
    const onBoardEffectComplete = vi.fn()
    const { container } = renderBoard(
      createInitialGameState(),
      {
        boardEffect: {
          id: 9,
          kind: 'webCapture',
          tileIndex: 0,
          playerId: 0,
        },
        onBoardEffectComplete,
      },
    )

    expect(container.querySelector('.web-capture-effect'))
      .toBeInTheDocument()
    expect(container.querySelector('.pawn-motion--web-captured'))
      .toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(849)
    })
    expect(onBoardEffectComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onBoardEffectComplete).toHaveBeenCalledWith(9)
  })

  it('同格炸弹和蛛网共用中心陷阱层', () => {
    const initialState = createInitialGameState()
    const state: GameState = {
      ...initialState,
      tileEffects: initialState.tileEffects.map((effect) =>
        effect.tileIndex === 1
          ? { ...effect, hasBomb: true, hasWeb: true }
          : effect,
      ),
    }
    const { container } = renderBoard(state)
    const tile = container.querySelector('[data-tile-index="1"]')

    expect(tile?.querySelector('.tile-trap-layer'))
      .toBeInTheDocument()
    expect(tile?.querySelector('.tile-trap--web'))
      .toBeInTheDocument()
    expect(tile?.querySelector('.tile-trap--bomb'))
      .toBeInTheDocument()
  })
})
