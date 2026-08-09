export type VisualAssetKey =
  | 'dice'
  | 'pawn'
  | 'house'
  | 'coin'
  | 'shop'
  | 'event'
  | 'jail'
  | 'hospital'
  | 'bomb'
  | 'remote'
  | 'web'

export type HouseTier =
  | 'small'
  | 'medium'
  | 'villa'

export const functionalIconSources = {
  shop: '/game-assets/functional/shop.png',
  event: '/game-assets/functional/event.png',
  jail: '/game-assets/functional/jail.png',
  hospital: '/game-assets/functional/hospital.png',
} as const

export const rollingDiceFrames = Array.from(
  { length: 6 },
  (_, index) =>
    `/game-assets/dice/rolling/摇动${index + 1}.png`,
)

export function getDiceFaceSource(value: number): string {
  const safeValue = Math.min(12, Math.max(1, value))

  return `/game-assets/dice/${safeValue}${safeValue}.png`
}

export function getHouseTier(level: number): HouseTier | null {
  if (level <= 0) return null
  if (level <= 2) return 'small'
  if (level <= 4) return 'medium'
  return 'villa'
}
