import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { PlayerPanel } from './components/PlayerPanel'
import { getAIAction } from './game/ai'
import { boardTiles } from './game/board'
import { createRandomEventAction } from './game/events'
import {
  createInitialGameState,
  gameReducer,
  getPropertyRent,
  getPropertyTotalCost,
  getRent,
  getUpgradeCost,
  PROPERTY_PRICE,
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
  const rollButtonRef =
    useRef<HTMLButtonElement>(null)
  const decisionButtonRef =
    useRef<HTMLButtonElement>(null)
  const skipButtonRef =
    useRef<HTMLButtonElement>(null)
  const restartButtonRef =
    useRef<HTMLButtonElement>(null)
  const shopButtonRef =
    useRef<HTMLButtonElement>(null)
  const cancelItemButtonRef =
    useRef<HTMLButtonElement>(null)
  const firstRemoteButtonRef =
    useRef<HTMLButtonElement>(null)
  const firstEventTargetRef =
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
        (gameState.mode === 'ai' &&
          gameState.currentPlayerId === 1) ||
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
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    gameStarted,
    gameState.phase,
    gameState.mode,
    gameState.currentPlayerId,
  ])

  useEffect(() => {
    if (!gameStarted) {
      return
    }

    if (
      gameState.mode === 'ai' &&
      gameState.currentPlayerId === 1
    ) {
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
      return
    }

    if (gameState.phase === 'awaitingShop') {
      shopButtonRef.current?.focus()
      return
    }

    if (gameState.phase === 'placingItem') {
      cancelItemButtonRef.current?.focus()
      return
    }

    if (gameState.phase === 'choosingRemoteDice') {
      firstRemoteButtonRef.current?.focus()
      return
    }

    if (gameState.phase === 'awaitingEventTarget') {
      firstEventTargetRef.current?.focus()
    }
  }, [
    gameStarted,
    gameState.phase,
    gameState.currentPlayerId,
    gameState.mode,
  ])

  useEffect(() => {
    if (!gameStarted) {
      return
    }

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

      if (action) {
        dispatch(action)
      }
    }, 650)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [gameStarted, gameState])

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

  const decisionCost = (() => {
    if (gameState.decision === 'buy') {
      return PROPERTY_PRICE
    }

    if (gameState.decision === 'acquire') {
      return getPropertyTotalCost(
        currentProperty?.level ?? 1,
      )
    }

    return getUpgradeCost(currentProperty?.level ?? 0)
  })()

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

  const hasUsableItems =
    currentPlayer.items.bomb > 0 ||
    currentPlayer.items.remote > 0 ||
    currentPlayer.items.shield > 0

  const isAITurn = currentPlayer.isAI

  function startGame(mode: GameMode) {
    dispatch({ type: 'RESET', mode })
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

  function drawShopItem() {
    const itemIndex = Math.floor(
      Math.random() * shopItems.length,
    )
    const item = shopItems[itemIndex]

    if (!item) {
      return
    }

    dispatch({
      type: 'RECEIVE_SHOP_ITEM',
      item,
    })
  }

  function placeItem(tileIndex: number) {
    dispatch({
      type: 'PLACE_ITEM',
      tileIndex,
    })
  }

  function resolveRandomEvent(targetId: PlayerId) {
    dispatch(createRandomEventAction(gameState, targetId))
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
            inJail={playerOne.inJail}
            jailTurnsLeft={playerOne.jailTurnsLeft}
            items={playerOne.items}
            confusedTurns={playerOne.confusedTurns}
            hasForcedAcquisition={
              playerOne.hasForcedAcquisition
            }
            isAI={playerOne.isAI}
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

              const tileEffect =
                gameState.tileEffects.find(
                  (effect) =>
                    effect.tileIndex === tile.index,
                )

              const isPlacingItem =
                gameState.phase === 'placingItem' &&
                !isAITurn

              const isPlacementBlocked =
                (gameState.placementItem === 'bomb' &&
                  tileEffect?.hasBomb) ||
                (gameState.placementItem === 'shield' &&
                  tileEffect?.hasShield)

              const label =
                property && property.level > 0
                  ? `${tile.label} L${property.level}`
                  : tile.label

              const propertyRent = property
                ? getPropertyRent(
                    property,
                    gameState.properties,
                  )
                : 0

              const hasNeighborBonus =
                property !== undefined &&
                property.ownerId !== null &&
                propertyRent > getRent(property.level)

              return (
                <div
                  className={`tile tile--${tile.kind}${
                    isPlacingItem
                      ? ' tile--selectable'
                      : ''
                  }${
                    isPlacementBlocked
                      ? ' tile--blocked'
                      : ''
                  }${
                    hasNeighborBonus
                      ? ' tile--linked'
                      : ''
                  }`}
                  key={tile.index}
                  style={{
                    gridColumn: tile.column,
                    gridRow: tile.row,
                    boxShadow: owner
                      ? `inset 0 -6px ${owner.color}`
                      : undefined,
                  }}
                  title={
                    isPlacingItem
                      ? `在第 ${tile.index} 格放置${
                          gameState.placementItem === 'bomb'
                            ? '炸弹'
                            : '蛛网'
                        }`
                      : owner
                        ? `第 ${tile.index} 格，${owner.name}的 ${property?.level} 级地产，租金 ${propertyRent}`
                        : `第 ${tile.index} 格`
                  }
                  role={isPlacingItem ? 'button' : undefined}
                  tabIndex={
                    isPlacingItem && !isPlacementBlocked
                      ? 0
                      : undefined
                  }
                  onClick={
                    isPlacingItem && !isPlacementBlocked
                      ? () => placeItem(tile.index)
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (
                      isPlacingItem &&
                      !isPlacementBlocked &&
                      (event.key === 'Enter' ||
                        event.key === ' ')
                    ) {
                      event.preventDefault()
                      placeItem(tile.index)
                    }
                  }}
                >
                  {label}

                  {hasNeighborBonus && (
                    <span
                      className="tile-bonus"
                      aria-label="相邻地产租金加成"
                    >
                      连
                    </span>
                  )}

                  {(tileEffect?.hasBomb ||
                    tileEffect?.hasShield) && (
                    <div
                      className="tile-effects"
                      aria-hidden="true"
                    >
                      {tileEffect.hasBomb && <span>💣</span>}
                      {tileEffect.hasShield && <span>🕸️</span>}
                    </div>
                  )}

                  <div className="pieces">
                    {gameState.players
                      .filter(
                        (player) =>
                          !player.bankrupt &&
                          player.position === tile.index,
                      )
                      .map((player) => (
                        <span
                          className={
                            player.inJail
                              ? 'piece piece--jailed'
                              : 'piece'
                          }
                          key={player.id}
                          style={{
                            backgroundColor: player.color,
                          }}
                          role="img"
                          aria-label={`${player.name}的棋子${
                            player.inJail
                              ? '，正在监狱中'
                              : ''
                          }`}
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
                {isAITurn
                  ? '电脑正在思考下一步…'
                  : gameState.phase === 'waitingForRoll'
                  ? '键盘：按 R 掷骰子'
                  : gameState.phase === 'awaitingDecision'
                    ? '键盘：按 Esc 跳过'
                    : gameState.phase === 'awaitingShop'
                      ? '键盘：按 Enter 抽取道具'
                      : gameState.phase === 'placingItem'
                        ? '选择棋盘格，按 Esc 取消'
                    : gameState.phase === 'choosingRemoteDice'
                          ? '选择点数，按 Esc 取消'
                          : gameState.phase === 'awaitingEventTarget'
                            ? '选择随机事件的目标玩家'
                          : '可以使用 Tab 和 Enter 操作按钮'}
              </p>

              {isAITurn &&
                gameState.phase !== 'moving' &&
                gameState.phase !== 'gameOver' && (
                  <p className="ai-thinking" aria-live="polite">
                    电脑思考中…
                  </p>
                )}

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

              {!isAITurn &&
                gameState.phase === 'waitingForRoll' && (
                <>
                  <button
                    ref={rollButtonRef}
                    type="button"
                    onClick={rollDice}
                  >
                    掷骰子
                  </button>

                  {hasUsableItems && (
                    <div className="item-actions">
                      {currentPlayer.items.bomb > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'START_ITEM_PLACEMENT',
                              item: 'bomb',
                            })
                          }
                        >
                          炸弹 ×{currentPlayer.items.bomb}
                        </button>
                      )}

                      {currentPlayer.items.remote > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'START_REMOTE_DICE',
                            })
                          }
                        >
                          遥控 ×{currentPlayer.items.remote}
                        </button>
                      )}

                      {currentPlayer.items.shield > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'START_ITEM_PLACEMENT',
                              item: 'shield',
                            })
                          }
                        >
                          蛛网 ×{currentPlayer.items.shield}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {gameState.phase === 'moving' && (
                <button type="button" disabled>
                  移动中…
                </button>
              )}

              {!isAITurn &&
                gameState.phase === 'awaitingDecision' && (
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

                  {gameState.decision === 'acquire' && (
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
                          type: 'ACQUIRE_PROPERTY',
                        })
                      }
                    >
                      强制收购（{decisionCost}）
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

              {!isAITurn &&
                gameState.phase === 'awaitingShop' && (
                <div className="shop-actions">
                  <p>免费随机获得一种道具</p>
                  <button
                    ref={shopButtonRef}
                    type="button"
                    onClick={drawShopItem}
                  >
                    抽取道具
                  </button>
                </div>
              )}

              {!isAITurn &&
                gameState.phase === 'choosingRemoteDice' && (
                <div className="remote-actions">
                  <p>选择遥控骰子点数</p>
                  <div className="remote-number-grid">
                    {[1, 2, 3, 4, 5, 6].map(
                      (value) => (
                        <button
                          ref={
                            value === 1
                              ? firstRemoteButtonRef
                              : undefined
                          }
                          type="button"
                          key={value}
                          onClick={() =>
                            dispatch({
                              type: 'USE_REMOTE_DICE',
                              value,
                            })
                          }
                        >
                          {value}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'CANCEL_ITEM_USE' })
                    }
                  >
                    取消
                  </button>
                </div>
              )}

              {!isAITurn &&
                gameState.phase === 'placingItem' && (
                <div className="placement-actions">
                  <p>
                    请选择放置
                    {gameState.placementItem === 'bomb'
                      ? '炸弹'
                      : '蛛网'}
                    的格子
                  </p>
                  <button
                    ref={cancelItemButtonRef}
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      dispatch({ type: 'CANCEL_ITEM_USE' })
                    }
                  >
                    取消放置
                  </button>
                </div>
              )}

              {!isAITurn &&
                gameState.phase === 'awaitingEventTarget' && (
                <div className="event-actions">
                  <p>选择一名玩家承受随机事件</p>
                  <div className="event-targets">
                    {gameState.players
                      .filter((player) => !player.bankrupt)
                      .map((player, index) => (
                        <button
                          ref={
                            index === 0
                              ? firstEventTargetRef
                              : undefined
                          }
                          type="button"
                          key={player.id}
                          onClick={() =>
                            resolveRandomEvent(player.id)
                          }
                        >
                          {player.name}
                        </button>
                      ))}
                  </div>
                </div>
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
            inJail={playerTwo.inJail}
            jailTurnsLeft={playerTwo.jailTurnsLeft}
            items={playerTwo.items}
            confusedTurns={playerTwo.confusedTurns}
            hasForcedAcquisition={
              playerTwo.hasForcedAcquisition
            }
            isAI={playerTwo.isAI}
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
      <p>选择游戏模式 · React + TypeScript</p>

      <button
        type="button"
        onClick={() => startGame('local')}
      >
        开始游戏
      </button>

      <button
        className="secondary-button"
        type="button"
        onClick={() => startGame('ai')}
      >
        单人挑战电脑
      </button>
    </main>
  )
}

export default App
