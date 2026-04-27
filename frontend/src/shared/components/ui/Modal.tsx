import { useEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ModalProps {
  /** Controls open/close state */
  open: boolean
  /** Called when backdrop, Escape, or the X button is clicked */
  onClose: () => void
  /** Modal dialog title shown in the header */
  title: string
  /** Content rendered in the scrollable body */
  children: ReactNode
  /** Optional footer (action buttons, etc.) */
  footer?: ReactNode
  /** Extra classes on the panel card */
  className?: string
  /**
   * Maximum width of the panel.
   * @default 'max-w-lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// ─── Size map ────────────────────────────────────────────────────────────────

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full mx-4',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ModalHeader({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/10 px-6 py-4">
      <h2
        id="modal-title"
        className="text-base font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        {title}
      </h2>

      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-md',
          'text-slate-500 transition-colors duration-150',
          'hover:bg-slate-100 hover:text-slate-900',
          'dark:text-slate-400 dark:hover:bg-surface-highlight dark:hover:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'active:scale-95'
        )}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-y-auto px-6 py-5', className)}>
      {children}
    </div>
  )
}

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-slate-200/10 px-6 py-4">
      {children}
    </div>
  )
}

// ─── Root Component ──────────────────────────────────────────────────────────

/**
 * `Modal` – Portal-based dialog with backdrop blur + enter/exit animations.
 *
 * @example
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={<Button variant="danger" onClick={handleDelete}>Delete</Button>}
 * >
 *   Are you sure you want to delete this item?
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  size = 'md',
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    // ── Backdrop ────────────────────────────────────────────────
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={cn(
        // Positioning + stacking
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        // Backdrop: blurred dark overlay
        'bg-bg-dark/80 backdrop-blur-sm',
        // Enter animation
        'animate-fade-in'
      )}
      onClick={(e) => {
        // Close only if the user clicked the backdrop, not the panel
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* ── Panel ──────────────────────────────────────────────── */}
      <div
        className={cn(
          // Width + responsive
          'w-full',
          sizeClasses[size],
          // Surface colour: white in light, deep surface in dark
          'rounded-xl bg-white shadow-2xl',
          'dark:bg-surface-dark dark:ring-1 dark:ring-white/10',
          // Enter animation (independent from backdrop)
          'animate-zoom-in',
          // Max height + flex column for sticky header/footer
          'flex max-h-[90dvh] flex-col',
          className
        )}
      >
        <ModalHeader title={title} onClose={onClose} />

        <ModalBody>{children}</ModalBody>

        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>,
    document.body
  )
}

// Named sub-component exports for advanced composition
Modal.Header = ModalHeader
Modal.Body   = ModalBody
Modal.Footer = ModalFooter
