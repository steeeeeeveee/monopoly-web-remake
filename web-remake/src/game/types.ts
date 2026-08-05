export type PlayerId = 0 | 1

export type GamePhase =
  | 'waitingForRoll'
  | 'moving'

export interface Player {
  id: PlayerId
  name: string
  color: string
  money: number
  position: number
  bankrupt: boolean
}

export interface GameState {
  players: Player[]
  currentPlayerId: PlayerId
  phase: GamePhase
  diceValue: number | null
  movementQueue: number[]
  log: string[]
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
      type: 'RESET'
    }