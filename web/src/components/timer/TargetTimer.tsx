import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { targetSchema, type TargetFormData } from '@/schemas/targetSchema'
import { getTarget, setTarget, deleteTarget } from '@/lib/target'
import { ApiError } from '@/lib/api'
import { blueClass } from '@/styles/buttonStyles'

const LOCK_DURATION_MS = 24 * 60 * 60 * 1000

function getRemaining(targetAt: string) {
  const diff = new Date(targetAt).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, done: false }
}

function getLockStatus(targetSetAt: string) {
  const unlocksAt = new Date(targetSetAt).getTime() + LOCK_DURATION_MS
  const remainingMs = Math.max(0, unlocksAt - Date.now())
  const canDeleteNow = remainingMs === 0

  const hours = Math.floor(remainingMs / (1000 * 60 * 60))
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60)
  const seconds = Math.floor((remainingMs / 1000) % 60)

  return { canDeleteNow, hours, minutes, seconds }
}


function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function TargetTimer() {
  const [targetAt, setTargetAt] = useState<string | null>(null)
  const [targetSetAt, setTargetSetAt] = useState<string | null>(null)
  const [targetReason, setTargetReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(() => (targetAt ? getRemaining(targetAt) : null))
  const [lockStatus, setLockStatus] = useState(() => (targetSetAt ? getLockStatus(targetSetAt) : null))
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: { days: 21, reason: '' },
  })

  useEffect(() => {
    getTarget()
      .then(({ targetAt, targetSetAt, targetReason }) => {
        setTargetAt(targetAt)
        setTargetSetAt(targetSetAt)
        setTargetReason(targetReason)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load target'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!targetAt) {
      setRemaining(null)
      return
    }
    setRemaining(getRemaining(targetAt))
    const interval = setInterval(() => setRemaining(getRemaining(targetAt)), 1000)
    return () => clearInterval(interval)
  }, [targetAt])

  useEffect(() => {
    if (!targetSetAt) {
      setLockStatus(null)
      return
    }
    setLockStatus(getLockStatus(targetSetAt))
    const interval = setInterval(() => setLockStatus(getLockStatus(targetSetAt)), 1000)
    return () => clearInterval(interval)
  }, [targetSetAt])

  const onSubmit = async (data: TargetFormData) => {
    setError(null)
    try {
      const { targetAt, targetReason } = await setTarget(data.days, data.reason)
      setTargetAt(targetAt)
      setTargetSetAt(new Date().toISOString())
      setTargetReason(targetReason)
      reset()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set target')
    }
  }

  const handleDeleteTarget = async () => {
    setError(null)
    setDeleting(true)
    try {
      await deleteTarget()
      setTargetAt(null)
      setTargetSetAt(null)
      setTargetReason(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete target')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="mt-6 text-sm text-white/50">Loading your target...</p>
  }

  return (
    <div className="mt-6 p-4">
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {targetAt && remaining ? (
        <div className="space-y-10">
          <div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/40">Time remaining</p>
            {remaining.done ? (
              <p className="text-4xl font-semibold text-text">Target reached</p>
            ) : (
              <p className="font-sans text-7xl tabular-nums text-text">
                {pad(remaining.days)}<span className="text-3xl text-white/30">d</span>{' '}
                {pad(remaining.hours)}<span className="text-3xl text-white/30">h</span>{' '}
                {pad(remaining.minutes)}<span className="text-3xl text-white/30">m</span>{' '}
                {pad(remaining.seconds)}<span className="text-3xl text-white/30">s</span>
              </p>
            )}
          </div>

          {targetReason && (
            <p className="text-sm text-white/70">"{targetReason}"</p>
          )}

          {lockStatus && !lockStatus.canDeleteNow ? (
            <p className="text-xs text-white/30 tabular-nums">
              Unlocks for deletion in {pad(lockStatus.hours)}h {pad(lockStatus.minutes)}m {pad(lockStatus.seconds)}s
            </p>
          ) : (
            <button
              onClick={handleDeleteTarget}
              disabled={deleting}
              className="border-b border-white/15 pb-0.5 text-xs text-white/40 transition-colors hover:border-white/40 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete target'}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
          <div>
            <p className="text-base font-medium text-white/80">No active target</p>
            <p className="mt-1.5 text-sm text-white/40">Set a duration and commit to it.</p>
          </div>

          <div>
            <label htmlFor="days" className="block text-xs font-medium uppercase tracking-wide text-white/40">
              Duration
            </label>
            <div className="mt-2 flex items-baseline gap-2.5">
              <input
                id="days"
                type="number"
                min={1}
                {...register('days', { valueAsNumber: true })}
                className="w-20 border-b border-white/20 bg-transparent py-1.5 text-2xl text-text tabular-nums focus:border-white/60 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-base text-white/40">days</span>
            </div>
            {errors.days && <p className="mt-2 text-sm text-red-400/90">{errors.days.message}</p>}
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs font-medium uppercase tracking-wide text-white/40">
              Reason
            </label>
            <input
              id="reason"
              type="text"
              {...register('reason')}
              placeholder="Why does this matter to you?"
              maxLength={500}
              className="mt-2 w-full border-b border-white/20 bg-transparent py-1.5 text-base text-text placeholder:text-white/25 focus:border-white/60 focus:outline-none"
            />
            {errors.reason && <p className="mt-2 text-sm text-red-400/90">{errors.reason.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={blueClass}
          >
            {isSubmitting ? 'Setting target…' : 'Set target'}
          </button>
        </form>
      )}
    </div>
  )
}