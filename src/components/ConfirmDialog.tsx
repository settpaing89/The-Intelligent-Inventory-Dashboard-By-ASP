import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
  errorMessage?: string | null
}

function ConfirmDialog(props: ConfirmDialogProps) {
  if (!props.isOpen) {
    return null
  }

  // No key/remount trick needed here (unlike ActionLogDrawer's
  // key={vehicle.id}) — this component carries no local state of its own to
  // reset; every value it renders comes straight from props.
  return <ConfirmDialogContent {...props} />
}

type ConfirmDialogContentProps = Omit<ConfirmDialogProps, 'isOpen'>

function ConfirmDialogContent({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending = false,
  errorMessage = null,
}: ConfirmDialogContentProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Default focus lands on Cancel, not Confirm — this dialog exists
    // specifically for destructive actions, so the safer control should be
    // the one a stray Enter keypress would trigger.
    cancelButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-[24rem] rounded-md bg-white p-lg shadow-elevation-high"
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-on-surface"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>

        {errorMessage && (
          <p role="alert" className="mt-3 text-sm text-error">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded border border-primary-container px-4 py-2 text-sm font-semibold text-primary-container hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded bg-error px-4 py-2 text-sm font-semibold text-on-error hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Removing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmDialog
