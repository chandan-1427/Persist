import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { targetSchema, type TargetFormData } from '@/schemas/targetSchema'
import { getTarget, setTarget, deleteTarget } from '@/lib/target'
import { ApiError } from '@/lib/api'

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
    <div className="mt-6 rounded border border-white/10 bg-white/5 p-4">
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {targetAt && remaining ? (
        <div className="space-y-3">
          <p className="text-sm text-white/50">Time remaining</p>
          {remaining.done ? (
            <p className="text-2xl font-semibold">Target reached 🎉</p>
          ) : (
            <p className="font-mono text-2xl">
              {remaining.days}d {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
            </p>
          )}

          {targetReason && <p className="text-sm text-white/60 italic">"{targetReason}"</p>}

          {lockStatus && !lockStatus.canDeleteNow ? (
<p className="text-sm text-white/40 tabular-nums">
  Unlocks for deletion in {pad(lockStatus.hours)}h {pad(lockStatus.minutes)}m {pad(lockStatus.seconds)}s
</p>
          ) : (
            <button
              onClick={handleDeleteTarget}
              disabled={deleting}
              className="text-sm text-white/50 underline hover:text-white/80 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete target'}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <p className="text-sm text-white/50">No active target</p>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                {...register('days', { valueAsNumber: true })}
                className="w-20 rounded border border-white/20 bg-transparent px-2 py-1 text-text"
              />
              <span className="text-sm text-white/50">days</span>
            </div>
            {errors.days && <p className="mt-1 text-xs text-red-400">{errors.days.message}</p>}
          </div>

          <div>
            <input
              type="text"
              {...register('reason')}
              placeholder="Why does this matter to you?"
              maxLength={500}
              className="w-full rounded border border-white/20 bg-transparent px-2 py-1 text-sm text-text placeholder:text-white/30"
            />
            {errors.reason && <p className="mt-1 text-xs text-red-400">{errors.reason.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="font-medium text-text border border-[#1C1C9F] py-1.5 px-3 bg-[#1C1C3A] hover:bg-[#1C1C8C] disabled:opacity-50"
          >
            {isSubmitting ? 'Setting...' : 'Set target'}
          </button>
        </form>
      )}
    </div>
  )
}