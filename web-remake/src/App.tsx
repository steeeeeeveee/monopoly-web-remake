import {
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
import type {
  GameMode,
  ItemType,
  PlayerId,
} from './game/types'
import './App.css'

const shopItems: ItemType[] = [
  'bomb',
  'remote',
  'shield',
]

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, dispatch] = useReducer(
    gameReducer,
    createInitialGameState(),
  )

  useEffect(() => {
    if (
      !gameStarted ||
      gameState.phase !== 'moving'
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      dispatch({ type: 'MOVE_ONE_STEP' })
    }, 300)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [
    gameStarted,
    gameState.phase,
    gameState.movementQueue,
  ])

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
        dispatch({
          type: 'ROLL',
          value: Math.floor(Math.random() * 6) + 1,
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
  }, [gameStarted, gameState])

  useEffect(() => {
    if (!gameStarted) return

    const aiPlayer = gameState.players.find(
      (player) =>
        player.id === gameState.currentPlayerId,
    )

    if (
      !aiPlayer?.isAI ||
      gameState.phase === 'moving' ||
      gameState.phase === 'gameOver'
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      const action = getAIAction(gameState)

      if (action) dispatch(action)
    }, 650)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [gameStarted, gameState])

  function startGame(mode: GameMode) {
    dispatch({ type: 'RESET', mode })
    setGameStarted(true)
  }

  function returnHome() {
    dispatch({ type: 'RESET' })
    setGameStarted(false)
  }

  function rollDice() {
    dispatch({
      type: 'ROLL',
      value: Math.floor(Math.random() * 6) + 1,
    })
  }

  function drawShopItem() {
    const item =
      shopItems[
        Math.floor(Math.random() * shopItems.length)
      ]

    if (item) {
      dispatch({ type: 'RECEIVE_SHOP_ITEM', item })
    }
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
      onDrawShopItem={drawShopItem}
      onResolveEvent={resolveRandomEvent}
      onReturnHome={returnHome}
    />
  )
}

export default App
