import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { PlayerPanel } from './components/PlayerPanel'
import { boardTiles } from './game/board'
import {
  createInitialGameState,
  gameReducer,
  getUpgradeCost,
  PROPERTY_PRICE,
} from './game/gameReducer'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, dispatch] = useReducer(
    gameReducer,
    createInitialGameState(),
  )
  const rollButtonRef =
    useRef<HTMLButtonElement>(null)
  const decisionButtonRef =
    useRef<HTMLButtonElement>(null)
  const skipButtonRef =
    useRef<HTMLButtonElement>(null)
  const restartButtonRef =
    useRef<HTMLButtonElement>(null)

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

      if (
        !gameStarted ||
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

        dispatch({
          type: 'SKIP_PROPERTY',
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [gameStarted, gameState.phase])

  useEffect(() => {
    if (!gameStarted) {
      return
    }

    if (gameState.phase === 'waitingForRoll') {
      rollButtonRef.current?.focus()
      return
    }

    if (gameState.phase === 'awaitingDecision') {
      const decisionButton =
        decisionButtonRef.current

      if (decisionButton && !decisionButton.disabled) {
        decisionButton.focus()
      } else {
        skipButtonRef.current?.focus()
      }

      return
    }

    if (gameState.phase === 'gameOver') {
      restartButtonRef.current?.focus()
    }
  }, [
    gameStarted,
    gameState.phase,
    gameState.currentPlayerId,
  ])

  const playerOne = gameState.players[0]
  const playerTwo = gameState.players[1]
  const currentPlayer =
    gameState.players[gameState.currentPlayerId]

  if (!playerOne || !playerTwo || !currentPlayer) {
    return null
  }

  const currentProperty = gameState.properties.find(
    (property) =>
      property.tileIndex === currentPlayer.position,
  )

  const decisionCost =
    gameState.decision === 'buy'
      ? PROPERTY_PRICE
      : getUpgradeCost(currentProperty?.level ?? 0)

  const canAfford =
    currentPlayer.money >= decisionCost

  const missingMoney =
    gameState.phase === 'awaitingDecision' &&
    !canAfford
      ? decisionCost - currentPlayer.money
      : 0

  const winner = gameState.players.find(
    (player) => player.id === gameState.winnerId,
  )

  function startGame() {
    dispatch({ type: 'RESET' })
    setGameStarted(true)
  }

  function returnHome() {
    dispatch({ type: 'RESET' })
    setGameStarted(false)
  }

  function rollDice() {
    const value = Math.floor(Math.random() * 6) + 1

    dispatch({
      type: 'ROLL',
      value,
    })
  }

  if (gameStarted) {
    return (
      <main>
        <h1>大富翁网页版</h1>

        <div className="game-layout">
          <PlayerPanel
            name={playerOne.name}
            money={playerOne.money}
            position={playerOne.position}
            color={playerOne.color}
            isActive={
              gameState.phase !== 'gameOver' &&
              gameState.currentPlayerId === 0
            }
          />

          <section className="board" aria-label="大富翁棋盘">
            {boardTiles.map((tile) => {
              const property = gameState.properties.find(
                (item) => item.tileIndex === tile.index,
              )

              const owner = gameState.players.find(
                (player) =>
                  player.id === property?.ownerId,
              )

              const label =
                property && property.level > 0
                  ? `${tile.label} L${property.level}`
                  : tile.label

              return (
                <div
                  className={`tile tile--${tile.kind}`}
                  key={tile.index}
                  style={{
                    gridColumn: tile.column,
                    gridRow: tile.row,
                    boxShadow: owner
                      ? `inset 0 -6px ${owner.color}`
                      : undefined,
                  }}
                  title={`第 ${tile.index} 格`}
                >
                  {label}

                  <div className="pieces">
                    {gameState.players
                      .filter(
                        (player) =>
                          !player.bankrupt &&
                          player.position === tile.index,
                      )
                      .map((player) => (
                        <span
                          className="piece"
                          key={player.id}
                          style={{
                            backgroundColor: player.color,
                          }}
                          role="img"
                          aria-label={`${player.name}的棋子`}
                        />
                      ))}
                  </div>
                </div>
              )
            })}

            <div
              className="game-controls"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p>
                {gameState.phase === 'gameOver'
                  ? '游戏结束'
                  : '当前回合'}
              </p>

              <strong>
                {winner
                  ? `${winner.name} 获胜`
                  : currentPlayer.name}
              </strong>

              <p className="keyboard-help">
                {gameState.phase === 'waitingForRoll'
                  ? '键盘：按 R 掷骰子'
                  : gameState.phase === 'awaitingDecision'
                    ? '键盘：按 Esc 跳过'
                    : '可以使用 Tab 和 Enter 操作按钮'}
              </p>

              {(gameState.phase === 'waitingForRoll' ||
                gameState.phase === 'moving') && (
                <div
                  className="dice"
                  aria-label={`骰子点数 ${
                    gameState.diceValue ?? '尚未投掷'
                  }`}
                >
                  {gameState.diceValue ?? '?'}
                </div>
              )}

              {gameState.phase === 'waitingForRoll' && (
                <button
                  ref={rollButtonRef}
                  type="button"
                  onClick={rollDice}
                >
                  掷骰子
                </button>
              )}

              {gameState.phase === 'moving' && (
                <button type="button" disabled>
                  移动中…
                </button>
              )}

              {gameState.phase === 'awaitingDecision' && (
                <>
                  {missingMoney > 0 && (
                    <p
                      id="decision-error"
                      className="error-message"
                      role="alert"
                    >
                      金币不足，还差 {missingMoney}
                    </p>
                  )}

                  {gameState.decision === 'buy' && (
                    <button
                      ref={decisionButtonRef}
                      type="button"
                      aria-describedby={
                        !canAfford
                          ? 'decision-error'
                          : undefined
                      }
                      disabled={!canAfford}
                      onClick={() =>
                        dispatch({
                          type: 'BUY_PROPERTY',
                        })
                      }
                    >
                      购买（{PROPERTY_PRICE}）
                    </button>
                  )}

                  {gameState.decision === 'upgrade' && (
                    <button
                      ref={decisionButtonRef}
                      type="button"
                      aria-describedby={
                        !canAfford
                          ? 'decision-error'
                          : undefined
                      }
                      disabled={!canAfford}
                      onClick={() =>
                        dispatch({
                          type: 'UPGRADE_PROPERTY',
                        })
                      }
                    >
                      升级（{decisionCost}）
                    </button>
                  )}

                  <button
                    ref={skipButtonRef}
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'SKIP_PROPERTY',
                      })
                    }
                  >
                    跳过
                  </button>
                </>
              )}

              {gameState.phase === 'gameOver' && (
                <button
                  ref={restartButtonRef}
                  type="button"
                  onClick={() =>
                    dispatch({ type: 'RESET' })
                  }
                >
                  再来一局
                </button>
              )}

              {gameState.phase !== 'gameOver' && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    dispatch({ type: 'RESET' })
                  }
                >
                  重新开始
                </button>
              )}

              <p>{gameState.log[0]}</p>
            </div>
          </section>

          <PlayerPanel
            name={playerTwo.name}
            money={playerTwo.money}
            position={playerTwo.position}
            color={playerTwo.color}
            isActive={
              gameState.phase !== 'gameOver' &&
              gameState.currentPlayerId === 1
            }
          />
        </div>

        <button type="button" onClick={returnHome}>
          返回首页
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>大富翁网页版</h1>
      <p>双人同屏游戏 · React + TypeScript</p>

      <button type="button" onClick={startGame}>
        开始游戏
      </button>
    </main>
  )
}

export default App
