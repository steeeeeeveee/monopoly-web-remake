import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { boardTiles } from '../game/board'
import type { GameMode } from '../game/types'
import { getHouseTier } from '../ui/visuals'
import { DiceView } from './DiceView'
import {
  GameIcon,
  HouseIcon,
  PawnIcon,
} from './GameIcon'
import { ModeCard } from './ModeCard'

interface HomeScreenProps {
  onStart: (mode: GameMode) => void
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [leaving, setLeaving] = useState(false)
  const selectedMode = useRef<GameMode | null>(null)
  const transitionTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current)
      }
    },
    [],
  )

  function selectMode(mode: GameMode) {
    if (leaving) return

    selectedMode.current = mode

    const reduceMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches ?? false

    if (reduceMotion) {
      onStart(mode)
      return
    }

    setLeaving(true)
    transitionTimer.current = window.setTimeout(() => {
      onStart(selectedMode.current ?? mode)
    }, 250)
  }

  return (
    <main
      className={`home-screen ${
        leaving ? 'home-screen--leaving' : ''
      }`}
    >
      <section className="home-hero" aria-labelledby="game-title">
        <div className="home-copy">
          <p className="home-eyebrow">经典棋盘 · 网页重制</p>
          <h1 id="game-title">
            <span>大富翁</span>
            <small>网页版</small>
          </h1>
          <p className="home-intro">
            买下地产、升级房屋，让金币沿着熟悉的
            52 格路线滚起来。
          </p>

          <div className="mode-list" aria-label="选择游戏模式">
            <ModeCard
              mode="local"
              title="双人同屏"
              description="两名玩家轮流操作，适合朋友面对面对局"
              onSelect={selectMode}
            />
            <ModeCard
              mode="ai"
              title="单人挑战电脑"
              description="与自动决策的电脑玩家展开一场较量"
              onSelect={selectMode}
            />
          </div>
        </div>

        <div className="home-preview" aria-label="棋盘画面预览">
          <div className="home-preview__glow" />
          <div className="mini-board" aria-hidden="true">
            {boardTiles.map((tile) => (
              <span
                className={`mini-tile mini-tile--${tile.kind}`}
                key={tile.index}
                style={{
                  gridColumn: tile.column,
                  gridRow: tile.row,
                }}
              >
                {tile.kind === 'gold' && (
                  <GameIcon name="coin" />
                )}
                {tile.kind === 'shop' && (
                  <GameIcon name="shop" />
                )}
                {tile.kind === 'event' && (
                  <GameIcon name="event" />
                )}
                {tile.kind === 'jail' && (
                  <GameIcon name="jail" />
                )}
                {tile.kind === 'hospital' && (
                  <GameIcon name="hospital" />
                )}
                {tile.kind === 'start' && (
                  <GameIcon name="start" />
                )}
              </span>
            ))}

            <div className="mini-board__center">
              <DiceView
                className="home-preview-dice"
                value={4}
                isRolling
              />
              <p>掷骰 · 买地 · 收租</p>
            </div>

            <PawnIcon
              className="mini-pawn mini-pawn--red"
              color="#ef5f68"
            />
            <PawnIcon
              className="mini-pawn mini-pawn--blue"
              color="#4b91e2"
            />
            <HouseIcon
              className="mini-house"
              tier={getHouseTier(4) ?? 'medium'}
              color="#f7bf3f"
            />
          </div>
        </div>
      </section>

      <p className="home-footnote">
        支持键盘操作 · 电脑与手机均可游玩
      </p>
    </main>
  )
}
