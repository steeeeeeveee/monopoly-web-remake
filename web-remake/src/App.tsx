import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { GameShell } from './components/GameShell'
import { HomeScreen } from './components/HomeScreen'
import { getAIAction } from './game/ai'
import { createRandomEventAction } from './game/events'
import {
  createInitialGameState,
  gameReducer,
} from './game/gameReducer'
import {
  getRandomDiceValue,
} from './game/constants'
import type {
  GameAction,
  GameMode,
  ItemType,
  PlayerId,
} from './game/types'
import type { BoardEffect } from './ui/boardEffects'
import './App.css'

type RandomEventAction = Extract<
  GameAction,
  { type: 'RESOLVE_RANDOM_EVENT' }
>

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSessionId, setGameSessionId] = useState(0)
  const [isDiceAnimating, setIsDiceAnimating] =
    useState(false)
  const [boardEffect, setBoardEffect] =
    useState<BoardEffect | null>(null)
  const pendingEventActionRef =
    useRef<RandomEventAction | null>(null)
  const activeBoardEffectRef =
    useRef<BoardEffect | null>(null)
  const nextBoardEffectIdRef = useRef(0)
  const [gameState, dispatch] = useReducer(
    gameReducer,
    createInitialGameState(),
  )

  const dispatchWithAnimation = useCallback(
    (action: GameAction) => {
      if (
        action.type === 'ROLL' ||
        action.type === 'USE_REMOTE_DICE'
      ) {
        setIsDiceAnimating(true)
      }

      dispatch(action)
    },
    [],
  )

  const finishDiceAnimation = useCallback(() => {
    setIsDiceAnimating(false)
  }, [])

  const finishMoveStep = useCallback(() => {
    dispatch({ type: 'MOVE_ONE_STEP' })
  }, [])

  const beginRandomEvent = useCallback(
    (action: RandomEventAction) => {
      if (activeBoardEffectRef.current) return

      if (
        action.event !== 'meteor' ||
        action.propertyTileIndex === undefined
      ) {
        dispatch(action)
        return
      }

      const effectId = nextBoardEffectIdRef.current
      nextBoardEffectIdRef.current += 1
      pendingEventActionRef.current = action
      const effect: BoardEffect = {
        id: effectId,
        kind: 'meteor',
        tileIndex: action.propertyTileIndex,
      }
      activeBoardEffectRef.current = effect
      setBoardEffect(effect)
    },
    [],
  )

  const finishBoardEffect = useCallback((effectId: number) => {
    if (activeBoardEffectRef.current?.id !== effectId) return

    const pendingAction = pendingEventActionRef.current
    pendingEventActionRef.current = null
    activeBoardEffectRef.current = null
    setBoardEffect(null)
    if (pendingAction) dispatch(pendingAction)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isUsingControl =
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      const isAITurn =
        gameState.mode === 'ai' &&
        gameState.currentPlayerId === 1

      if (
        !gameStarted ||
        isAITurn ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        isUsingControl
      ) {
        return
      }

      if (
        event.code === 'KeyR' &&
        gameState.phase === 'waitingForRoll'
      ) {
        event.preventDefault()
        dispatchWithAnimation({
          type: 'ROLL',
          value: getRandomDiceValue(),
        })
      }

      if (
        event.key === 'Escape' &&
        gameState.phase === 'awaitingDecision'
      ) {
        event.preventDefault()
        dispatch({ type: 'SKIP_PROPERTY' })
      }

      if (
        event.key === 'Escape' &&
        (gameState.phase === 'placingItem' ||
          gameState.phase === 'choosingRemoteDice')
      ) {
        event.preventDefault()
        dispatch({ type: 'CANCEL_ITEM_USE' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatchWithAnimation, gameStarted, gameState])

  useEffect(() => {
    if (!gameStarted) return

    const aiPlayer = gameState.players.find(
      (player) =>
        player.id === gameState.currentPlayerId,
    )

    if (
      !aiPlayer?.isAI ||
      boardEffect !== null ||
      gameState.phase === 'moving' ||
      gameState.phase === 'awaitingShop' ||
      gameState.phase === 'gameOver'
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      const action = getAIAction(gameState)

      if (!action) return

      if (action.type === 'RESOLVE_RANDOM_EVENT') {
        beginRandomEvent(action)
      } else {
        dispatchWithAnimation(action)
      }
    }, 650)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [
    beginRandomEvent,
    boardEffect,
    dispatchWithAnimation,
    gameStarted,
    gameState,
  ])

  function clearDisplayEffects() {
    pendingEventActionRef.current = null
    activeBoardEffectRef.current = null
    setBoardEffect(null)
  }

  function startGame(mode: GameMode) {
    dispatch({ type: 'RESET', mode })
    setGameSessionId((current) => current + 1)
    setIsDiceAnimating(false)
    clearDisplayEffects()
    setGameStarted(true)
  }

  function returnHome() {
    dispatch({ type: 'RESET' })
    setGameSessionId((current) => current + 1)
    setIsDiceAnimating(false)
    clearDisplayEffects()
    setGameStarted(false)
  }

  function rollDice() {
    dispatchWithAnimation({
      type: 'ROLL',
      value: getRandomDiceValue(),
    })
  }

  function useRemoteDice(value: number) {
    dispatchWithAnimation({
      type: 'USE_REMOTE_DICE',
      value,
    })
  }

  function awardShopItem(item: ItemType) {
    dispatch({ type: 'RECEIVE_SHOP_ITEM', item })
  }

  function resetGame() {
    dispatch({ type: 'RESET' })
    setGameSessionId((current) => current + 1)
    setIsDiceAnimating(false)
    clearDisplayEffects()
  }

  function resolveRandomEvent(targetId: PlayerId) {
    beginRandomEvent(
      createRandomEventAction(
        gameState,
        targetId,
      ),
    )
  }

  if (!gameStarted) {
    return <HomeScreen onStart={startGame} />
  }

  return (
    <GameShell
      state={gameState}
      dispatch={dispatch}
      onRoll={rollDice}
      onUseRemoteDice={useRemoteDice}
      onAwardShopItem={awardShopItem}
      onResolveEvent={resolveRandomEvent}
      onResetGame={resetGame}
      onReturnHome={returnHome}
      isDiceAnimating={isDiceAnimating}
      onDiceAnimationComplete={finishDiceAnimation}
      onMoveStepComplete={finishMoveStep}
      boardEffect={boardEffect}
      onBoardEffectComplete={finishBoardEffect}
      gameSessionId={gameSessionId}
    />
  )
}

export default App
