export type DiceAnimationVariant = 'classic' | 'impact'

export function getDiceAnimationVariant(
  search = window.location.search,
): DiceAnimationVariant {
  const requestedVariant = new URLSearchParams(search).get(
    'diceAnimation',
  )

  return requestedVariant === 'impact' ? 'impact' : 'classic'
}
