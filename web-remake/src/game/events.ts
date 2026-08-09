import type {
  GameAction,
  GameState,
  PlayerId,
  RandomEventResult,
} from './types'

type RandomSource = () => number
type RandomEventAction = Extract<
  GameAction,
  { type: 'RESOLVE_RANDOM_EVENT' }
>

export function createRandomEventAction(
  state: GameState,
  targetId: PlayerId,
  random: RandomSource = Math.random,
): RandomEventAction {
  const eventRoll = Math.floor(random() * 4)
  let event: RandomEventResult
  let propertyTileIndex: number | undefined

  if (eventRoll === 0) {
    event = 'meteor'

    const ownedProperties = state.properties.filter(
      (property) => property.ownerId === targetId,
    )

    if (ownedProperties.length > 0) {
      const propertyIndex = Math.floor(
        random() * ownedProperties.length,
      )
      propertyTileIndex =
        ownedProperties[propertyIndex]?.tileIndex
    }
  } else if (eventRoll === 1) {
    event = 'confusion'
  } else if (eventRoll === 2) {
    event = random() < 0.6 ? 'moneyDouble' : 'moneyHalf'
  } else {
    event = 'acquisition'
  }

  return {
    type: 'RESOLVE_RANDOM_EVENT',
    targetId,
    event,
    propertyTileIndex,
  }
}
