import { useEffect, useReducer, useState } from 'react'
import { PlayerPanel } from './components/PlayerPanel'
import { boardTiles } from './game/board'
import {
  createInitialGameState,
  gameReducer,
} from './game/gameReducer'
import './App.css'

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

  const playerOne = gameState.players[0]
  const playerTwo = gameState.players[1]
  const currentPlayer =
    gameState.players[gameState.currentPlayerId]

  if (!playerOne || !playerTwo || !currentPlayer) {
    return null
  }

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
            isActive={gameState.currentPlayerId === 0}
          />

          <section className="board" aria-label="大富翁棋盘">
            {boardTiles.map((tile) => (
              <div
                className={`tile tile--${tile.kind}`}
                key={tile.index}
                style={{
                  gridColumn: tile.column,
                  gridRow: tile.row,
                }}
                title={`第 ${tile.index} 格`}
              >
                {tile.label}

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
            ))}

            <div className="game-controls" aria-live="polite">
              <p>当前回合</p>
              <strong>{currentPlayer.name}</strong>

              <div className="dice">
                {gameState.diceValue ?? '?'}
              </div>

              <button
                type="button"
                onClick={rollDice}
                disabled={gameState.phase !== 'waitingForRoll'}
              >
                {gameState.phase === 'moving'
                  ? '移动中…'
                  : '掷骰子'}
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
              >
                重新开始
              </button>

              <p>{gameState.log[0]}</p>
            </div>
          </section>

          <PlayerPanel
            name={playerTwo.name}
            money={playerTwo.money}
            position={playerTwo.position}
            color={playerTwo.color}
            isActive={gameState.currentPlayerId === 1}
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