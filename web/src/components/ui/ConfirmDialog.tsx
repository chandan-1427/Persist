import { useEffect } from 'react'
import { redClass, whiteClass } from '@/styles/buttonStyles'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-sm border border-white/15 bg-[#1c1c1c] p-6 shadow-lg shadow-black/40">
        <h2 className="text-base font-medium text-text">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-white/60">{description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={confirming}
            className={whiteClass}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={redClass}
          >
            {confirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}