import { useEffect, useState } from 'react'
import {
  getDiceFaceSource,
  rollingDiceFrames,
} from '../ui/visuals'

interface DiceViewProps {
  value: number | null
  isRolling: boolean
  className?: string
}

export function DiceView({
  value,
  isRolling,
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
    }, 490)

    return () => {
      window.clearInterval(frameTimer)
      window.clearTimeout(finishTimer)
    }
  }, [isRolling, value])

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
