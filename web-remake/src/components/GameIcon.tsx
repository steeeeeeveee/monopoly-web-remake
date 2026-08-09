import type { HouseTier } from '../ui/visuals'

type GameIconName =
  | 'coin'
  | 'shop'
  | 'event'
  | 'jail'
  | 'hospital'
  | 'bomb'
  | 'remote'
  | 'web'
  | 'start'
  | 'computer'

interface GameIconProps {
  name: GameIconName
  className?: string
  title?: string
}

export function GameIcon({
  name,
  className = '',
  title,
}: GameIconProps) {
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

      {name === 'shop' && (
        <>
          <path
            d="M10 26h44l-4-14H14Z"
            fill="#fff8e8"
            stroke="#243250"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M14 27v28h36V27"
            fill="#fff8e8"
            stroke="#243250"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M11 26c0 6 9 7 11 1 2 6 9 6 11 0 2 6 9 6 11 0 2 6 10 5 10-1"
            fill="none"
            stroke="#2e9d73"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path d="M28 41h8v14h-8Z" fill="#5bc994" />
        </>
      )}

      {name === 'event' && (
        <>
          <path
            d="M32 7c13 0 22 8 22 20 0 13-12 17-16 22H26c-4-5-16-9-16-22C10 15 19 7 32 7Z"
            fill="#f5edff"
            stroke="#342657"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M24 24c1-6 5-9 10-9 6 0 10 3 10 8 0 7-8 8-10 14"
            fill="none"
            stroke="#8d63df"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <circle cx="33" cy="47" r="3.5" fill="#8d63df" />
        </>
      )}

      {name === 'jail' && (
        <>
          <rect
            x="9"
            y="8"
            width="46"
            height="48"
            rx="7"
            fill="#edf0f4"
            stroke="#354052"
            strokeWidth="4"
          />
          <path d="M19 10v44M32 10v44M45 10v44" stroke="#7b8493" strokeWidth="5" />
          <path d="M9 20h46M9 46h46" stroke="#354052" strokeWidth="4" />
          <circle cx="39" cy="34" r="4" fill="#354052" />
        </>
      )}

      {name === 'hospital' && (
        <>
          <path
            d="M12 13h40v43H12Z"
            fill="#f7efff"
            stroke="#342657"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path d="M26 8h12v20H26Z" fill="#ffffff" stroke="#342657" strokeWidth="4" />
          <path d="M32 12v12M26 18h12" stroke="#ef5f68" strokeLinecap="round" strokeWidth="5" />
          <path d="M20 39h8v17h-8ZM36 39h8v17h-8Z" fill="#9c7be8" />
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

      {name === 'web' && (
        <>
          <circle cx="32" cy="32" r="25" fill="#f3edff" stroke="#342657" strokeWidth="3" />
          <circle cx="32" cy="32" r="17" fill="none" stroke="#8d63df" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="9" fill="none" stroke="#8d63df" strokeWidth="2.5" />
          <path
            d="M32 7v50M7 32h50M14 14l36 36M50 14 14 50"
            stroke="#8d63df"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <circle cx="37" cy="27" r="3.5" fill="#342657" />
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
