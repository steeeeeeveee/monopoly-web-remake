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
import {
  createEventExplosionSequence,
  createTrapEffectSequence,
  type BoardEffect,
  type BoardEffectSpec,
} from './ui/boardEffects'
import './App.css'

type RandomEventAction = Extract<
  GameAction,
  { type: 'RESOLVE_RANDOM_EVENT' }
>

type TileEffectResolutionAction = Extract<
  GameAction,
  { type: 'RESOLVE_TILE_EFFECTS' }
>

type DeferredBoardAction =
  | RandomEventAction
  | TileEffectResolutionAction

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSessionId, setGameSessionId] = useState(0)
  const [isDiceAnimating, setIsDiceAnimating] =
    useState(false)
  const [boardEffect, setBoardEffect] =
    useState<BoardEffect | null>(null)
  const boardEffectQueueRef = useRef<BoardEffect[]>([])
  const deferredBoardActionRef =
    useRef<DeferredBoardAction | null>(null)
  const activeBoardEffectRef =
    useRef<BoardEffect | null>(null)
  const resolvingTrapKeyRef = useRef<string | null>(null)
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

  const materializeBoardEffects = useCallback(
    (specs: BoardEffectSpec[]): BoardEffect[] =>
      specs.map((spec) => {
        const id = nextBoardEffectIdRef.current
        nextBoardEffectIdRef.current += 1
        return { ...spec, id } as BoardEffect
      }),
    [],
  )

  const startBoardEffectSequence = useCallback(
    (
      effects: BoardEffect[],
      finalAction: DeferredBoardAction,
    ) => {
      if (activeBoardEffectRef.current) return false

      if (effects.length === 0) {
        dispatch(finalAction)
        return true
      }

      const [firstEffect, ...remainingEffects] = effects
      if (!firstEffect) return false

      boardEffectQueueRef.current = remainingEffects
      deferredBoardActionRef.current = finalAction
      activeBoardEffectRef.current = firstEffect
      setBoardEffect(firstEffect)
      return true
    },
    [],
  )

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

      startBoardEffectSequence(
        materializeBoardEffects(
          createEventExplosionSequence(
            action.propertyTileIndex,
          ),
        ),
        action,
      )
    },
    [materializeBoardEffects, startBoardEffectSequence],
  )

  const finishBoardEffect = useCallback((effectId: number) => {
    if (activeBoardEffectRef.current?.id !== effectId) return

    const nextEffect = boardEffectQueueRef.current.shift()

    if (nextEffect) {
      activeBoardEffectRef.current = nextEffect
      setBoardEffect(nextEffect)
      return
    }

    const pendingAction = deferredBoardActionRef.current
    deferredBoardActionRef.current = null
    activeBoardEffectRef.current = null
    resolvingTrapKeyRef.current = null
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
      const isAITurn = gameState.players.find(
        (player) => player.id === gameState.currentPlayerId,
      )?.isAI ?? false

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
      gameState.phase === 'resolvingTileEffect' ||
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

  useEffect(() => {
    if (
      !gameStarted ||
      gameState.phase !== 'resolvingTileEffect' ||
      activeBoardEffectRef.current
    ) {
      return
    }

    const player = gameState.players.find(
      (candidate) =>
        candidate.id === gameState.currentPlayerId,
    )
    if (!player) return

    const tileEffect = gameState.tileEffects.find(
      (effect) => effect.tileIndex === player.position,
    )
    const trapKey = `${gameSessionId}:${player.id}:${player.position}:${Boolean(
      tileEffect?.hasWeb,
    )}:${Boolean(tileEffect?.hasBomb)}`

    if (resolvingTrapKeyRef.current === trapKey) return
    resolvingTrapKeyRef.current = trapKey

    const effects = materializeBoardEffects(
      createTrapEffectSequence(
        player.position,
        player.id,
        Boolean(tileEffect?.hasWeb),
        Boolean(tileEffect?.hasBomb),
      ),
    )

    startBoardEffectSequence(effects, {
      type: 'RESOLVE_TILE_EFFECTS',
    })
  }, [
    gameSessionId,
    gameStarted,
    gameState.currentPlayerId,
    gameState.phase,
    gameState.players,
    gameState.tileEffects,
    materializeBoardEffects,
    startBoardEffectSequence,
  ])

  function clearDisplayEffects() {
    boardEffectQueueRef.current = []
    deferredBoardActionRef.current = null
    activeBoardEffectRef.current = null
    resolvingTrapKeyRef.current = null
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
