import { useState } from 'react'
import { PlayerPanel } from './components/PlayerPanel'
import { boardTiles } from './game/board'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)

  if (gameStarted) {
    return (
      <main>
        <h1>棋盘原型</h1>

        <div className="game-layout">
          <PlayerPanel
            name="玩家 1"
            money={5000}
            color="#ff6b6b"
            isActive={true}
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
              </div>
            ))}
          </section>

          <PlayerPanel
            name="玩家 2"
            money={5000}
            color="#4dabf7"
            isActive={false}
          />
        </div>

        <button
          type="button"
          onClick={() => setGameStarted(false)}
        >
          返回首页
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>大富翁网页版</h1>
      <p>双人同屏游戏 · React + TypeScript</p>

      <button
        type="button"
        onClick={() => setGameStarted(true)}
      >
        开始游戏
      </button>
    </main>
  )
}

export default App