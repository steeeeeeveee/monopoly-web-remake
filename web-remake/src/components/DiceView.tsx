import { useEffect, useState } from 'react'
import {
  getDiceFaceSource,
  rollingDiceFrames,
} from '../ui/visuals'
import {
  DICE_FRAME_DURATION_MS,
  DICE_ROLL_DURATION_MS,
  IMPACT_DICE_DESCENT_START_MS,
  IMPACT_DICE_FLIGHT_START_MS,
  IMPACT_DICE_FRAME_DURATION_MS,
  IMPACT_DICE_RESULT_REVEAL_MS,
} from '../game/constants'
import type { DiceAnimationVariant } from '../ui/diceAnimation'

type ImpactDicePhase =
  | 'idle'
  | 'anticipation'
  | 'flight'
  | 'descent'
  | 'impact'

interface DiceViewProps {
  value: number | null
  isRolling: boolean
  onAnimationComplete?: () => void
  className?: string
  animationVariant?: DiceAnimationVariant
}

export function DiceView({
  value,
  isRolling,
  onAnimationComplete,
  className = '',
  animationVariant = 'classic',
}: DiceViewProps) {
  const [rollingFrame, setRollingFrame] = useState(0)
  const [showClassicRollingFrame, setShowClassicRollingFrame] =
    useState(false)
  const [impactPhase, setImpactPhase] =
    useState<ImpactDicePhase>('idle')

  useEffect(() => {
    if (!isRolling) {
      setShowClassicRollingFrame(false)
      setImpactPhase('idle')
      return
    }

    const reduceMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches ?? false

    if (reduceMotion) {
      setShowClassicRollingFrame(false)
      setImpactPhase('idle')
      onAnimationComplete?.()
      return
    }

    setRollingFrame(0)

    if (animationVariant === 'impact') {
      setShowClassicRollingFrame(false)
      setImpactPhase('anticipation')

      const frameTimer = window.setInterval(() => {
        setRollingFrame(
          (currentFrame) =>
            (currentFrame + 1) % rollingDiceFrames.length,
        )
      }, IMPACT_DICE_FRAME_DURATION_MS)
      const flightTimer = window.setTimeout(() => {
        setImpactPhase('flight')
      }, IMPACT_DICE_FLIGHT_START_MS)
      const descentTimer = window.setTimeout(() => {
        setImpactPhase('descent')
      }, IMPACT_DICE_DESCENT_START_MS)
      const revealTimer = window.setTimeout(() => {
        window.clearInterval(frameTimer)
        setImpactPhase('impact')
      }, IMPACT_DICE_RESULT_REVEAL_MS)
      const finishTimer = window.setTimeout(() => {
        setImpactPhase('idle')
        onAnimationComplete?.()
      }, DICE_ROLL_DURATION_MS)

      return () => {
        window.clearInterval(frameTimer)
        window.clearTimeout(flightTimer)
        window.clearTimeout(descentTimer)
        window.clearTimeout(revealTimer)
        window.clearTimeout(finishTimer)
      }
    }

    setImpactPhase('idle')
    setShowClassicRollingFrame(true)

    const frameTimer = window.setInterval(() => {
      setRollingFrame(
        (currentFrame) =>
          (currentFrame + 1) % rollingDiceFrames.length,
      )
    }, DICE_FRAME_DURATION_MS)
    const finishTimer = window.setTimeout(() => {
      setShowClassicRollingFrame(false)
      window.clearInterval(frameTimer)
      onAnimationComplete?.()
    }, DICE_ROLL_DURATION_MS)

    return () => {
      window.clearInterval(frameTimer)
      window.clearTimeout(finishTimer)
    }
  }, [animationVariant, isRolling, onAnimationComplete, value])

  const showImpactRollingFrame =
    animationVariant === 'impact' &&
    (impactPhase === 'anticipation' ||
      impactPhase === 'flight' ||
      impactPhase === 'descent')
  const showRollingFrame =
    showClassicRollingFrame || showImpactRollingFrame
  const showImpactStage =
    animationVariant === 'impact' && impactPhase !== 'idle'

  const finalImageSource = value
    ? getDiceFaceSource(value)
    : null
  const rollingImageSource = showRollingFrame
    ? rollingDiceFrames[rollingFrame]
    : null

  return (
    <div
      className={`dice-view ${
        showClassicRollingFrame ? 'dice-view--rolling' : ''
      } ${
        showImpactStage
          ? `dice-view--impact dice-view--impact-${impactPhase}`
          : ''
      } ${className}`}
      data-animation-variant={animationVariant}
      data-animation-phase={impactPhase}
      aria-label={`骰子点数 ${value ?? '尚未投掷'}`}
    >
      {animationVariant === 'impact' && (
        <>
          <span
            className="dice-impact-shadow"
            aria-hidden="true"
          />
          <span
            className="dice-impact-ring"
            aria-hidden="true"
          />
          {Array.from({ length: 6 }, (_, index) => (
            <span
              className={`dice-impact-spark dice-impact-spark--${
                index + 1
              }`}
              key={index}
              aria-hidden="true"
            />
          ))}
        </>
      )}
      {finalImageSource && (
        <img
          className={`dice-view__final-face ${
            showRollingFrame
              ? 'dice-view__final-face--preloaded'
              : ''
          }`}
          data-dice-layer="final"
          src={finalImageSource}
          alt=""
          aria-hidden="true"
        />
      )}
      {rollingImageSource && (
        <img
          className="dice-view__rolling-frame"
          data-dice-layer="rolling"
          src={rollingImageSource}
          alt=""
          aria-hidden="true"
        />
      )}
      {!finalImageSource && !rollingImageSource && (
        <span aria-hidden="true">?</span>
      )}
    </div>
  )
}
