import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'

interface GameModalProps {
  open: boolean
  title: string
  description?: string
  icon?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  onCancel?: () => void
  closeLabel?: string
  tone?: 'default' | 'positive' | 'warning'
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function GameModal({
  open,
  title,
  description,
  icon,
  children,
  actions,
  onCancel,
  closeLabel = '关闭',
  tone = 'default',
}: GameModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const dialog = dialogRef.current
    const firstControl =
      dialog?.querySelector<HTMLElement>('[data-autofocus]') ??
      dialog?.querySelector<HTMLElement>('button:not([disabled])')
    firstControl?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && onCancel) {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !dialog) return

      const focusableControls = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          focusableSelector,
        ),
      )

      if (focusableControls.length === 0) {
        event.preventDefault()
        return
      }

      const firstControlInDialog = focusableControls[0]
      const lastControl =
        focusableControls[focusableControls.length - 1]

      if (
        event.shiftKey &&
        document.activeElement === firstControlInDialog
      ) {
        event.preventDefault()
        lastControl?.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === lastControl
      ) {
        event.preventDefault()
        firstControlInDialog?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-layer">
      <div className="modal-backdrop" aria-hidden="true" />
      <div
        className={`game-modal game-modal--${tone}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        {onCancel && (
          <button
            className="modal-close"
            type="button"
            onClick={onCancel}
            aria-label={closeLabel}
          >
            ×
          </button>
        )}

        {icon && <div className="modal-icon">{icon}</div>}
        <h2 id={titleId}>{title}</h2>
        {description && (
          <p id={descriptionId} className="modal-description">
            {description}
          </p>
        )}
        {children && (
          <div className="modal-content">{children}</div>
        )}
        {actions && (
          <div className="modal-actions">{actions}</div>
        )}
      </div>
    </div>
  )
}
