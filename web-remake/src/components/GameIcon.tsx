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
  | 'dizzy'
  | 'acquisition'
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
          <ellipse cx="25" cy="38" rx="18" ry="15" fill="#d88a13" />
          <path
            d="M7 31v8c0 8 8 14 18 14s18-6 18-14v-8Z"
            fill="#e9a622"
            stroke="#77430d"
            strokeLinejoin="round"
            strokeWidth="3.5"
          />
          <ellipse
            cx="25"
            cy="31"
            rx="18"
            ry="15"
            fill="#ffc94b"
            stroke="#77430d"
            strokeWidth="3.5"
          />
          <ellipse cx="25" cy="31" rx="12" ry="9.5" fill="#f5ae2d" />
          <path
            d="m25 22 2.5 5.5 6 .7-4.4 4.1 1.2 5.8-5.3-2.9-5.3 2.9 1.2-5.8-4.4-4.1 6-.7Z"
            fill="#fff2a8"
            stroke="#a36210"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M14 23c3-3 6-4 10-4"
            fill="none"
            stroke="#fff7c7"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <ellipse
            cx="44"
            cy="22"
            rx="13"
            ry="11"
            fill="#ffc94b"
            stroke="#77430d"
            strokeWidth="3.5"
          />
          <path d="M39 18c2-2 5-2 7-1" stroke="#fff7c7" strokeLinecap="round" strokeWidth="2.5" />
          <path d="M36 26c5 5 13 5 19-1" fill="none" stroke="#d88a13" strokeWidth="3" />
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
            d="M10 22h44v34H10Z"
            fill="#ffffff"
            stroke="#26324f"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path d="M19 22V11h26v11" fill="#ffffff" stroke="#26324f" strokeLinejoin="round" strokeWidth="4" />
          <path d="M32 13v14M25 20h14" stroke="#ef5f68" strokeLinecap="round" strokeWidth="5" />
          <path d="M17 34h8v8h-8ZM39 34h8v8h-8Z" fill="#9fd9ef" stroke="#26324f" strokeWidth="2.5" />
          <path d="M27 43h10v13H27Z" fill="#9fd9ef" stroke="#26324f" strokeWidth="3" />
          <path d="M7 56h50" stroke="#26324f" strokeLinecap="round" strokeWidth="4" />
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
          <path
            d="M7 8 29 31M57 7 29 31M56 55 29 31M8 56 29 31M29 4v27M4 31h25"
            fill="none"
            stroke="#f7f3ff"
            strokeLinecap="round"
            strokeWidth="4.8"
          />
          <path
            d="M15 16c8-3 15-2 21 2M8 31c8-7 17-9 27-6M15 48c2-9 9-17 19-22M45 13c-1 9 1 17 8 24M47 50c-2-8-8-14-17-18"
            fill="none"
            stroke="#c9b6f5"
            strokeLinecap="round"
            strokeWidth="3.4"
          />
          <path d="M42 29v12" stroke="#342657" strokeLinecap="round" strokeWidth="2.5" />
          <ellipse cx="42" cy="45" rx="5.5" ry="6" fill="#342657" />
          <circle cx="42" cy="39" r="4" fill="#5d3f8e" />
          <path d="m38 42-5-3m5 7-6 2m14-6 5-3m-5 7 6 2" stroke="#342657" strokeLinecap="round" strokeWidth="2.5" />
        </>
      )}

      {name === 'dizzy' && (
        <>
          <path
            d="M11 35c5-14 38-17 43-3 4 11-16 17-28 12-10-4-7-12 2-14 8-2 16 2 15 7"
            fill="none"
            stroke="#5f4898"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path d="m16 17 2.5 5.5 6 .7-4.5 4 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.5-4 6-.7Zm29-6 2.1 4.5 5 .6-3.7 3.4 1 5-4.4-2.5-4.4 2.5 1-5-3.7-3.4 5-.6Z" fill="#ffd05a" stroke="#7e5111" strokeLinejoin="round" strokeWidth="2" />
          <circle cx="31" cy="18" r="4" fill="#ff7d85" stroke="#7b3342" strokeWidth="2" />
        </>
      )}

      {name === 'acquisition' && (
        <>
          <path d="M7 35 27 18l20 17v21H7Z" fill="#fff5df" stroke="#243250" strokeLinejoin="round" strokeWidth="4" />
          <path d="M19 56V39h16v17" fill="#ef8e74" stroke="#243250" strokeWidth="3" />
          <circle cx="47" cy="19" r="13" fill="#ffc94b" stroke="#77430d" strokeWidth="3.5" />
          <path d="m47 11 2.2 4.7 5.1.6-3.8 3.5 1 5-4.5-2.6-4.5 2.6 1-5-3.8-3.5 5.1-.6Z" fill="#fff2a8" stroke="#a36210" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M38 35h19M50 29l7 6-7 6" fill="none" stroke="#2e9d73" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
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
