export const DICE_MIN = 1
export const DICE_MAX = 12
export const DICE_ROLL_DURATION_MS = 900
export const DICE_FRAME_DURATION_MS = 100
export const MOVE_STEP_DURATION_MS = 280

export type RandomSource = () => number

export function getRandomDiceValue(
  random: RandomSource = Math.random,
): number {
  const value = Math.floor(random() * DICE_MAX) + DICE_MIN

  return Math.min(DICE_MAX, Math.max(DICE_MIN, value))
}
