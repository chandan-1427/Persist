import { useEffect, useState } from 'react'
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

export function TargetTimer() {
  const [targetAt, setTargetAt] = useState<string | null>(null)
  const [targetSetAt, setTargetSetAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [remaining, setRemaining] = useState(() => (targetAt ? getRemaining(targetAt) : null))
  const [lockStatus, setLockStatus] = useState(() => (targetSetAt ? getLockStatus(targetSetAt) : null))
  const [daysInput, setDaysInput] = useState(21)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTarget()
      .then(({ targetAt, targetSetAt }) => {
        setTargetAt(targetAt)
        setTargetSetAt(targetSetAt)
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

  const handleSetTarget = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const { targetAt } = await setTarget(daysInput)
      setTargetAt(targetAt)
      setTargetSetAt(new Date().toISOString())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set target')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTarget = async () => {
    setError(null)
    setDeleting(true)
    try {
      await deleteTarget()
      setTargetAt(null)
      setTargetSetAt(null)
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

          {lockStatus && !lockStatus.canDeleteNow ? (
            <p className="text-sm text-white/40">
              Unlocks for deletion in {lockStatus.hours}h {lockStatus.minutes}m {lockStatus.seconds}s
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
        <div className="space-y-3">
          <p className="text-sm text-white/50">No active target</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={daysInput}
              onChange={(e) => setDaysInput(Number(e.target.value))}
              className="w-20 rounded border border-white/20 bg-transparent px-2 py-1 text-text"
            />
            <span className="text-sm text-white/50">days</span>
            <button
              onClick={handleSetTarget}
              disabled={submitting || daysInput < 1}
              className="ml-2 font-medium text-text border border-[#1C1C9F] py-1.5 px-3 bg-[#1C1C3A] hover:bg-[#1C1C8C] disabled:opacity-50"
            >
              {submitting ? 'Setting...' : 'Set target'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}