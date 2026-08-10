export type PlayerId = 0 | 1

export type GameMode = 'local' | 'ai'

export type GamePhase =
  | 'waitingForRoll'
  | 'moving'
  | 'resolvingTileEffect'
  | 'awaitingDecision'
  | 'awaitingShop'
  | 'choosingRemoteDice'
  | 'placingItem'
  | 'awaitingEventTarget'
  | 'gameOver'

export type ItemType =
  | 'bomb'
  | 'remote'
  | 'web'

export interface PlayerInventory {
  bomb: number
  remote: number
  web: number
}

export type PlacementItem = 'bomb' | 'web'

export interface TileEffectState {
  tileIndex: number
  hasBomb: boolean
  hasWeb: boolean
}

export type PropertyDecision =
  | 'buy'
  | 'upgrade'
  | 'acquire'
  | null

export type RandomEventResult =
  | 'meteor'
  | 'confusion'
  | 'moneyDouble'
  | 'moneyHalf'
  | 'acquisition'

export interface Player {
  id: PlayerId
  name: string
  color: string
  money: number
  position: number
  bankrupt: boolean
  inJail: boolean
  jailTurnsLeft: number
  items: PlayerInventory
  confusedTurns: number
  hasForcedAcquisition: boolean
  isAI: boolean
}

export interface PropertyState {
  tileIndex: number
  ownerId: PlayerId | null
  level: number
}

export interface GameState {
  mode: GameMode
  players: Player[]
  properties: PropertyState[]
  tileEffects: TileEffectState[]
  currentPlayerId: PlayerId
  phase: GamePhase
  decision: PropertyDecision
  diceValue: number | null
  movementQueue: number[]
  movementDirection: 1 | -1
  log: string[]
  winnerId: PlayerId | null
  placementItem: PlacementItem | null
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
      type: 'RESOLVE_TILE_EFFECTS'
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
      type: 'RECEIVE_SHOP_ITEM'
      item: ItemType
    }
  | {
      type: 'START_ITEM_PLACEMENT'
      item: PlacementItem
    }
  | {
      type: 'PLACE_ITEM'
      tileIndex: number
    }
  | {
      type: 'START_REMOTE_DICE'
    }
  | {
      type: 'USE_REMOTE_DICE'
      value: number
    }
  | {
      type: 'CANCEL_ITEM_USE'
    }
  | {
      type: 'RESOLVE_RANDOM_EVENT'
      targetId: PlayerId
      event: RandomEventResult
      propertyTileIndex?: number
    }
  | {
      type: 'ACQUIRE_PROPERTY'
    }
  | {
      type: 'RESET'
      mode?: GameMode
    }
