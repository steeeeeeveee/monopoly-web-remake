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

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const functionalIconSources = {
  shop: publicAsset('game-assets/functional/shop.png'),
  event: publicAsset('game-assets/functional/event.png'),
  jail: publicAsset('game-assets/functional/jail.png'),
  hospital: publicAsset('game-assets/functional/hospital.png'),
} as const

export const rollingDiceFrames = Array.from(
  { length: 6 },
  (_, index) =>
    publicAsset(`game-assets/dice/rolling/rolling-${index + 1}.png`),
)

export function getDiceFaceSource(value: number): string {
  const safeValue = Math.min(12, Math.max(1, value))

  return publicAsset(`game-assets/dice/${safeValue}${safeValue}.png`)
}

export function getHouseTier(level: number): HouseTier | null {
  if (level <= 0) return null
  if (level <= 2) return 'small'
  if (level <= 4) return 'medium'
  return 'villa'
}
