import type { GameMode } from '../game/types'
import { GameIcon, PawnIcon } from './GameIcon'

interface ModeCardProps {
  mode: GameMode
  title: string
  description: string
  onSelect: (mode: GameMode) => void
}

export function ModeCard({
  mode,
  title,
  description,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      className={`mode-card mode-card--${mode}`}
      type="button"
      aria-label={title}
      onClick={() => onSelect(mode)}
    >
      <span className="mode-card__visual" aria-hidden="true">
        <PawnIcon color="#ef5f68" />
        {mode === 'local' ? (
          <PawnIcon color="#4b91e2" />
        ) : (
          <GameIcon name="computer" />
        )}
      </span>

      <span className="mode-card__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>

      <span className="mode-card__arrow" aria-hidden="true">
        →
      </span>
    </button>
  )
}
