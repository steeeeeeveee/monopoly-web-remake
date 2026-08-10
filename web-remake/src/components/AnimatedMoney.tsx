import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { GameIcon } from './GameIcon'

interface AnimatedMoneyProps {
  value: number
  resetKey: number
}

interface MoneyDelta {
  id: number
  amount: number
}

const MONEY_ROLL_DURATION_MS = 500
const MONEY_DELTA_DURATION_MS = 1200

function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)')
      .matches ?? false
  )
}

export function AnimatedMoney({
  value,
  resetKey,
}: AnimatedMoneyProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [deltas, setDeltas] = useState<MoneyDelta[]>([])
  const previousValueRef = useRef(value)
  const displayValueRef = useRef(value)
  const resetKeyRef = useRef(resetKey)
  const nextDeltaIdRef = useRef(0)
  const rollTimerRef = useRef<number | null>(null)
  const removalTimersRef = useRef(new Set<number>())

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey
      previousValueRef.current = value
      displayValueRef.current = value
      setDisplayValue(value)
      setDeltas([])

      if (rollTimerRef.current !== null) {
        window.clearInterval(rollTimerRef.current)
        rollTimerRef.current = null
      }

      for (const timer of removalTimersRef.current) {
        window.clearTimeout(timer)
      }
      removalTimersRef.current.clear()
      return
    }

    const previousValue = previousValueRef.current
    const difference = value - previousValue

    if (difference === 0) return

    previousValueRef.current = value
    const deltaId = nextDeltaIdRef.current
    nextDeltaIdRef.current += 1
    setDeltas((current) => [
      ...current,
      { id: deltaId, amount: difference },
    ])

    const removalTimer = window.setTimeout(() => {
      setDeltas((current) =>
        current.filter((delta) => delta.id !== deltaId),
      )
      removalTimersRef.current.delete(removalTimer)
    }, MONEY_DELTA_DURATION_MS)
    removalTimersRef.current.add(removalTimer)

    if (rollTimerRef.current !== null) {
      window.clearInterval(rollTimerRef.current)
    }

    if (prefersReducedMotion()) {
      displayValueRef.current = value
      setDisplayValue(value)
      rollTimerRef.current = null
      return
    }

    const startingValue = displayValueRef.current
    const startedAt = Date.now()

    rollTimerRef.current = window.setInterval(() => {
      const progress = Math.min(
        1,
        (Date.now() - startedAt) / MONEY_ROLL_DURATION_MS,
      )
      const easedProgress = 1 - (1 - progress) ** 2
      const nextValue = Math.round(
        startingValue +
          (value - startingValue) * easedProgress,
      )

      displayValueRef.current = nextValue
      setDisplayValue(nextValue)

      if (progress >= 1 && rollTimerRef.current !== null) {
        window.clearInterval(rollTimerRef.current)
        rollTimerRef.current = null
      }
    }, 16)
  }, [resetKey, value])

  useEffect(
    () => () => {
      if (rollTimerRef.current !== null) {
        window.clearInterval(rollTimerRef.current)
      }
      for (const timer of removalTimersRef.current) {
        window.clearTimeout(timer)
      }
    },
    [],
  )

  return (
    <span className="animated-money">
      <GameIcon name="coin" />
      <strong aria-label={`金币 ${value}`}>
        ¥ {displayValue}
      </strong>
      <span className="money-deltas" aria-live="polite">
        {deltas.map((delta, index) => (
          <span
            className={`money-delta ${
              delta.amount > 0
                ? 'money-delta--positive'
                : 'money-delta--negative'
            }`}
            style={{
              '--delta-order': index,
              '--money-delta-color':
                delta.amount > 0 ? '#5df0a4' : '#ff6474',
              '--money-delta-background':
                delta.amount > 0
                  ? 'rgb(10 71 47 / 94%)'
                  : 'rgb(91 24 38 / 94%)',
            } as CSSProperties}
            key={delta.id}
          >
            {delta.amount > 0 ? '+' : ''}
            {delta.amount}
          </span>
        ))}
      </span>
    </span>
  )
}
