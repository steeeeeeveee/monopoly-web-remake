import { useEffect, useState } from 'react'
import {
  getDiceFaceSource,
  rollingDiceFrames,
} from '../ui/visuals'
import { DICE_ROLL_DURATION_MS } from '../game/constants'

interface DiceViewProps {
  value: number | null
  isRolling: boolean
  onAnimationComplete?: () => void
  className?: string
}

export function DiceView({
  value,
  isRolling,
  onAnimationComplete,
  className = '',
}: DiceViewProps) {
  const [rollingFrame, setRollingFrame] = useState(0)
  const [showRollingFrame, setShowRollingFrame] =
    useState(false)

  useEffect(() => {
    if (!isRolling) {
      setShowRollingFrame(false)
      return
    }

    const reduceMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches ?? false

    if (reduceMotion) {
      setShowRollingFrame(false)
      onAnimationComplete?.()
      return
    }

    setRollingFrame(0)
    setShowRollingFrame(true)

    const frameTimer = window.setInterval(() => {
      setRollingFrame(
        (currentFrame) =>
          (currentFrame + 1) % rollingDiceFrames.length,
      )
    }, 70)
    const finishTimer = window.setTimeout(() => {
      setShowRollingFrame(false)
      window.clearInterval(frameTimer)
      onAnimationComplete?.()
    }, DICE_ROLL_DURATION_MS)

    return () => {
      window.clearInterval(frameTimer)
      window.clearTimeout(finishTimer)
    }
  }, [isRolling, onAnimationComplete, value])

  const imageSource = showRollingFrame
    ? rollingDiceFrames[rollingFrame]
    : value
      ? getDiceFaceSource(value)
      : null

  return (
    <div
      className={`dice-view ${
        showRollingFrame ? 'dice-view--rolling' : ''
      } ${className}`}
      aria-label={`骰子点数 ${value ?? '尚未投掷'}`}
    >
      {imageSource ? (
        <img src={imageSource} alt="" aria-hidden="true" />
      ) : (
        <span aria-hidden="true">?</span>
      )}
    </div>
  )
}
