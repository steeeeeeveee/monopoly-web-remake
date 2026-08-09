import {
  useCallback,
  useEffect,
  useReducer,
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
  MOVE_STEP_DURATION_MS,
} from './game/constants'
import type {
  GameAction,
  GameMode,
  ItemType,
  PlayerId,
} from './game/types'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSessionId, setGameSessionId] = useState(0)
  const [isDiceAnimating, setIsDiceAnimating] =
    useState(false)
  const [gameState, dispatch] = useReducer(
    gameReducer,
    createInitialGameState(),
  )

  useEffect(() => {
    if (
      !gameStarted ||
      gameState.phase !== 'moving' ||
      isDiceAnimating
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      dispatch({ type: 'MOVE_ONE_STEP' })
    }, MOVE_STEP_DURATION_MS)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [
    gameStarted,
    gameState.phase,
    gameState.movementQueue,
    isDiceAnimating,
  ])

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
      gameState.phase === 'moving' ||
      gameState.phase === 'awaitingShop' ||
      gameState.phase === 'gameOver'
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      const action = getAIAction(gameState)

      if (action) dispatchWithAnimation(action)
    }, 650)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [dispatchWithAnimation, gameStarted, gameState])

  function startGame(mode: GameMode) {
    dispatch({ type: 'RESET', mode })
    setGameSessionId((current) => current + 1)
    setIsDiceAnimating(false)
    setGameStarted(true)
  }

  function returnHome() {
    dispatch({ type: 'RESET' })
    setGameSessionId((current) => current + 1)
    setIsDiceAnimating(false)
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
  }

  function resolveRandomEvent(targetId: PlayerId) {
    dispatch(createRandomEventAction(gameState, targetId))
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
      gameSessionId={gameSessionId}
    />
  )
}

export default App
