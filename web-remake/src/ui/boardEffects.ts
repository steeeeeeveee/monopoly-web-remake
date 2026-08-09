export interface BoardEffect {
  id: number
  kind: 'meteor'
  tileIndex: number
}

export const METEOR_EFFECT_DURATION_MS = 950
export const REDUCED_METEOR_EFFECT_DURATION_MS = 120
