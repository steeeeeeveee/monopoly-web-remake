import type { PlayerId } from '../game/types'

interface BaseBoardEffect {
  id: number
  tileIndex: number
}

export type BoardEffect =
  | (BaseBoardEffect & {
      kind: 'webCapture'
      playerId: PlayerId
    })
  | (BaseBoardEffect & {
      kind: 'eventBombDrop'
    })
  | (BaseBoardEffect & {
      kind: 'explosion'
      source: 'event' | 'trap'
      playerId?: PlayerId
    })

export type BoardEffectSpec =
  | Omit<Extract<BoardEffect, { kind: 'webCapture' }>, 'id'>
  | Omit<Extract<BoardEffect, { kind: 'eventBombDrop' }>, 'id'>
  | Omit<Extract<BoardEffect, { kind: 'explosion' }>, 'id'>

export const WEB_CAPTURE_DURATION_MS = 850
export const EVENT_BOMB_DROP_DURATION_MS = 420
export const EXPLOSION_DURATION_MS = 800

export const REDUCED_WEB_CAPTURE_DURATION_MS = 120
export const REDUCED_EVENT_BOMB_DROP_DURATION_MS = 0
export const REDUCED_EXPLOSION_DURATION_MS = 160

export function createEventExplosionSequence(
  tileIndex: number,
): BoardEffectSpec[] {
  return [
    { kind: 'eventBombDrop', tileIndex },
    { kind: 'explosion', source: 'event', tileIndex },
  ]
}

export function createTrapEffectSequence(
  tileIndex: number,
  playerId: PlayerId,
  hasWeb: boolean,
  hasBomb: boolean,
): BoardEffectSpec[] {
  const effects: BoardEffectSpec[] = []

  if (hasWeb) {
    effects.push({ kind: 'webCapture', tileIndex, playerId })
  }

  if (hasBomb) {
    effects.push({
      kind: 'explosion',
      source: 'trap',
      tileIndex,
      playerId,
    })
  }

  return effects
}

export function getBoardEffectDuration(
  effect: BoardEffect,
  reducedMotion: boolean,
): number {
  if (effect.kind === 'webCapture') {
    return reducedMotion
      ? REDUCED_WEB_CAPTURE_DURATION_MS
      : WEB_CAPTURE_DURATION_MS
  }

  if (effect.kind === 'eventBombDrop') {
    return reducedMotion
      ? REDUCED_EVENT_BOMB_DROP_DURATION_MS
      : EVENT_BOMB_DROP_DURATION_MS
  }

  return reducedMotion
    ? REDUCED_EXPLOSION_DURATION_MS
    : EXPLOSION_DURATION_MS
}
