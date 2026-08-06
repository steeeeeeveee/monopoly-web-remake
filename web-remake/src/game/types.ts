export type PlayerId = 0 | 1

export type GamePhase =
  | 'waitingForRoll'
  | 'moving'
  | 'awaitingDecision'
  | 'gameOver'

export type PropertyDecision =
  | 'buy'
  | 'upgrade'
  | null

export interface Player {
  id: PlayerId
  name: string
  color: string
  money: number
  position: number
  bankrupt: boolean
}

export interface PropertyState {
  tileIndex: number
  ownerId: PlayerId | null
  level: number
}

export interface GameState {
  players: Player[]
  properties: PropertyState[]
  currentPlayerId: PlayerId
  phase: GamePhase
  decision: PropertyDecision
  diceValue: number | null
  movementQueue: number[]
  log: string[]
  winnerId: PlayerId | null
}

export type GameAction =
  | {
      type: 'ROLL'
      value: number
    }
  | {
      type: 'MOVE_ONE_STEP'
    }
  | {
      type: 'BUY_PROPERTY'
    }
  | {
      type: 'SKIP_PROPERTY'
    }
  | {
      type: 'UPGRADE_PROPERTY'
    }
  | {
      type: 'RESET'
    }