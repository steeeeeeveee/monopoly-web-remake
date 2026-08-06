import {
  functionalIconSources,
  type HouseTier,
} from '../ui/visuals'

type GameIconName =
  | 'coin'
  | 'shop'
  | 'event'
  | 'jail'
  | 'hospital'
  | 'bomb'
  | 'remote'
  | 'shield'
  | 'start'
  | 'computer'

interface GameIconProps {
  name: GameIconName
  className?: string
  title?: string
}

const rasterIcons = new Set([
  'shop',
  'event',
  'jail',
  'hospital',
])

export function GameIcon({
  name,
  className = '',
  title,
}: GameIconProps) {
  if (rasterIcons.has(name)) {
    const source =
      functionalIconSources[
        name as keyof typeof functionalIconSources
      ]

    return (
      <img
        className={`game-icon game-icon--raster ${className}`}
        src={source}
        alt={title ?? ''}
        aria-hidden={title ? undefined : true}
      />
    )
  }

  return (
    <svg
      className={`game-icon ${className}`}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {name === 'coin' && (
        <>
          <circle cx="32" cy="32" r="25" fill="#f7bf3f" />
          <circle
            cx="32"
            cy="32"
            r="20"
            fill="none"
            stroke="#8b5a16"
            strokeWidth="3"
          />
          <path
            d="M21 26h22M21 38h22M32 21v22"
            fill="none"
            stroke="#8b5a16"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </>
      )}

      {name === 'bomb' && (
        <>
          <circle cx="29" cy="36" r="19" fill="#26324f" />
          <path
            d="M39 22c2-7 7-10 13-9"
            fill="none"
            stroke="#26324f"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M52 8v8M48 12h8"
            stroke="#f7bf3f"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="23" cy="29" r="5" fill="#ffffff" opacity=".7" />
        </>
      )}

      {name === 'remote' && (
        <>
          <rect
            x="15"
            y="8"
            width="34"
            height="48"
            rx="11"
            fill="#4b91e2"
            stroke="#23314e"
            strokeWidth="4"
          />
          <circle cx="32" cy="22" r="7" fill="#f7bf3f" />
          <circle cx="25" cy="39" r="4" fill="#ffffff" />
          <circle cx="39" cy="39" r="4" fill="#ffffff" />
          <path
            d="M25 49h14"
            stroke="#23314e"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </>
      )}

      {name === 'shield' && (
        <>
          <path
            d="M32 6 53 15v15c0 13-8 23-21 28C19 53 11 43 11 30V15Z"
            fill="#9c7be8"
            stroke="#33235a"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <circle cx="32" cy="31" r="13" fill="none" stroke="#fff" strokeWidth="2.5" />
          <path d="M32 18v26M19 31h26M23 22l18 18M41 22 23 40" stroke="#fff" strokeWidth="2" />
        </>
      )}

      {name === 'start' && (
        <>
          <path d="M19 56V8" stroke="#243250" strokeLinecap="round" strokeWidth="5" />
          <path d="M22 10h29L44 23l7 13H22Z" fill="#ef5f68" stroke="#243250" strokeLinejoin="round" strokeWidth="4" />
        </>
      )}

      {name === 'computer' && (
        <>
          <rect x="9" y="13" width="46" height="35" rx="9" fill="#4b91e2" stroke="#243250" strokeWidth="4" />
          <circle cx="25" cy="30" r="4" fill="#fff" />
          <circle cx="39" cy="30" r="4" fill="#fff" />
          <path d="M24 40h16M32 8v5M25 55h14" stroke="#243250" strokeLinecap="round" strokeWidth="4" />
        </>
      )}
    </svg>
  )
}

interface PawnIconProps {
  color: string
  className?: string
  title?: string
}

export function PawnIcon({
  color,
  className = '',
  title,
}: PawnIconProps) {
  return (
    <svg
      className={`pawn-icon ${className}`}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ellipse cx="32" cy="56" rx="22" ry="5" fill="#17213b" opacity=".2" />
      <path
        d="M19 51 25 28h14l6 23c-8 5-18 5-26 0Z"
        fill={color}
        stroke="#ffffff"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="32" cy="20" r="13" fill={color} stroke="#ffffff" strokeWidth="3" />
      <circle cx="27" cy="15" r="4" fill="#ffffff" opacity=".75" />
    </svg>
  )
}

interface HouseIconProps {
  tier: HouseTier
  color?: string
  className?: string
}

export function HouseIcon({
  tier,
  color = '#ef5f68',
  className = '',
}: HouseIconProps) {
  return (
    <svg
      className={`house-icon house-icon--${tier} ${className}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      {tier === 'small' && (
        <>
          <path d="M9 31 32 12l23 19v24H9Z" fill={color} stroke="#243250" strokeLinejoin="round" strokeWidth="5" />
          <rect x="26" y="38" width="12" height="17" rx="2" fill="#fff5df" />
        </>
      )}
      {tier === 'medium' && (
        <>
          <path d="M6 31 30 10l24 21v25H6Z" fill={color} stroke="#243250" strokeLinejoin="round" strokeWidth="5" />
          <path d="M43 20V9h8v18" fill={color} stroke="#243250" strokeLinejoin="round" strokeWidth="4" />
          <rect x="14" y="37" width="11" height="10" rx="2" fill="#fff5df" />
          <rect x="35" y="37" width="11" height="19" rx="2" fill="#fff5df" />
        </>
      )}
      {tier === 'villa' && (
        <>
          <path d="M4 34 17 21V9h30v12l13 13v22H4Z" fill={color} stroke="#243250" strokeLinejoin="round" strokeWidth="5" />
          <rect x="25" y="37" width="14" height="19" rx="2" fill="#fff5df" />
          <rect x="10" y="39" width="9" height="9" rx="2" fill="#fff5df" />
          <rect x="45" y="39" width="9" height="9" rx="2" fill="#fff5df" />
        </>
      )}
    </svg>
  )
}
