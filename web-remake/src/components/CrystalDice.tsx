import { useId } from 'react'

interface CrystalDiceProps {
  value: number | null
  layer: 'rolling' | 'final'
}

function wrapDiceValue(value: number): number {
  return ((value - 1) % 12) + 1
}

export function CrystalDice({
  value,
  layer,
}: CrystalDiceProps) {
  const idPrefix = useId().replace(/:/g, '')
  const shellGradientId = `${idPrefix}-shell`
  const coreGradientId = `${idPrefix}-core`
  const glowId = `${idPrefix}-glow`
  const safeValue = value === null ? null : wrapDiceValue(value)
  const seedValue = safeValue ?? 1
  const sideValues = [
    wrapDiceValue(seedValue + 4),
    wrapDiceValue(seedValue + 7),
    wrapDiceValue(seedValue + 10),
  ]

  return (
    <svg
      className="crystal-die"
      data-dice-layer={layer}
      viewBox="0 0 100 100"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={shellGradientId}
          x1="18"
          y1="13"
          x2="84"
          y2="91"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#56e7ff" />
          <stop offset=".32" stopColor="#2778d8" />
          <stop offset=".72" stopColor="#15366f" />
          <stop offset="1" stopColor="#08172f" />
        </linearGradient>
        <radialGradient
          id={coreGradientId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(42 36) rotate(54) scale(47)"
        >
          <stop offset="0" stopColor="#fff9c7" />
          <stop offset=".38" stopColor="#ffd45e" />
          <stop offset="1" stopColor="#e18a19" />
        </radialGradient>
        <filter
          id={glowId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
        >
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        className="crystal-die__shell"
        d="M50 4 72 10 90 27 96 50 88 74 70 91 46 97 23 88 7 69 4 45 14 22 31 9Z"
        fill={`url(#${shellGradientId})`}
        stroke="#8df3ff"
        strokeWidth="3"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />

      <path
        d="M31 9 50 25 14 22Z"
        fill="#72efff"
        fillOpacity=".55"
      />
      <path
        d="M50 25 72 10 90 27 72 43Z"
        fill="#2e82e4"
        fillOpacity=".72"
      />
      <path
        d="M72 43 90 27 96 50 77 61Z"
        fill="#18477f"
        fillOpacity=".9"
      />
      <path
        d="M77 61 88 74 70 91 57 75Z"
        fill="#0b244b"
        fillOpacity=".94"
      />
      <path
        d="M57 75 70 91 46 97 36 76Z"
        fill="#12315f"
        fillOpacity=".9"
      />
      <path
        d="M36 76 46 97 23 88 18 64Z"
        fill="#1f599c"
        fillOpacity=".72"
      />
      <path
        d="M18 64 23 88 7 69 4 45 23 43Z"
        fill="#2a7bc3"
        fillOpacity=".62"
      />
      <path
        d="M23 43 4 45 14 22 31 9 35 28Z"
        fill="#55d8ee"
        fillOpacity=".52"
      />

      <path
        className="crystal-die__core"
        d="M50 25 72 43 63 70 36 76 18 55 23 43Z"
        fill={`url(#${coreGradientId})`}
        stroke="#fff5ae"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M27 42 49 28 66 42"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity=".72"
      />
      <circle cx="34" cy="35" r="3.2" fill="#fff" opacity=".78" />

      <text
        className="crystal-die__side-number crystal-die__side-number--left"
        x="16"
        y="53"
        textAnchor="middle"
      >
        {sideValues[0]}
      </text>
      <text
        className="crystal-die__side-number crystal-die__side-number--right"
        x="82"
        y="50"
        textAnchor="middle"
      >
        {sideValues[1]}
      </text>
      <text
        className="crystal-die__side-number crystal-die__side-number--bottom"
        x="52"
        y="89"
        textAnchor="middle"
      >
        {sideValues[2]}
      </text>
      <text
        className="crystal-die__value"
        x="47"
        y="57"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {safeValue ?? '◆'}
      </text>
    </svg>
  )
}
