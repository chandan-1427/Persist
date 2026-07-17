import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, type Variants } from 'framer-motion'
import { targetSchema, type TargetFormData } from '@/schemas/targetSchema'
import { getTarget, setTarget, deleteTarget } from '@/lib/target'
import { ApiError } from '@/lib/api'
import { blueClass } from '@/styles/buttonStyles'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const LOCK_DURATION_MS = 24 * 60 * 60 * 1000

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

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
  const [confirmOpen, setConfirmOpen] = useState(false)

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
      setConfirmOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete target')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm uppercase tracking-widest text-white/40">Loading your target…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-text md:py-24">
      {error && (
        <p role="alert" className="mb-6 border-l-2 border-red-800 pl-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {targetAt && remaining ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-14">
          <motion.div variants={item}>
            <p className="text-sm font-medium uppercase tracking-widest text-white/40">
              Time remaining
            </p>

            {remaining.done ? (
              <p className="mt-4 text-6xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
                Target reached.
              </p>
            ) : (
              <p className="mt-4 font-sans text-6xl font-bold tabular-nums leading-none tracking-tight text-white md:text-8xl">
                {pad(remaining.days)}<span className="mx-1 text-2xl font-medium text-white/30 md:text-3xl">d</span>
                {pad(remaining.hours)}<span className="mx-1 text-2xl font-medium text-white/30 md:text-3xl">h</span>
                {pad(remaining.minutes)}<span className="mx-1 text-2xl font-medium text-white/30 md:text-3xl">m</span>
                {pad(remaining.seconds)}<span className="mx-1 text-2xl font-medium text-white/30 md:text-3xl">s</span>
              </p>
            )}
          </motion.div>

          {targetReason && (
            <motion.div variants={item} className="bg-red-800 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                Why you started?
              </p>
              <p className="mt-2 text-xl font-medium leading-snug text-white">
                {targetReason}
              </p>
            </motion.div>
          )}

          <motion.div variants={item}>
            {lockStatus && !lockStatus.canDeleteNow ? (
              <p className="text-xs uppercase tracking-widest text-white/30 tabular-nums">
                Unlocks for deletion in {pad(lockStatus.hours)}h {pad(lockStatus.minutes)}m{' '}
                {pad(lockStatus.seconds)}s
              </p>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="border-b border-white/15 pb-0.5 text-xs uppercase tracking-widest text-white/40 transition-colors hover:border-white/40 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete target
              </button>
            )}
          </motion.div>
        </motion.div>
      ) : (
        <motion.form
          variants={container}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-12"
        >
          <motion.div variants={item}>
            <p className="text-sm font-medium uppercase tracking-widest text-white/40">
              No active target
            </p>
            <p className="mt-4 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
              Set the timer.
              <br />
              Commit to it.
            </p>
          </motion.div>

          <motion.div variants={item}>
            <label htmlFor="days" className="block text-xs font-medium uppercase tracking-widest text-white/40">
              Duration
            </label>
            <div className="mt-3 flex items-baseline gap-3">
              <input
                id="days"
                type="number"
                min={1}
                {...register('days', { valueAsNumber: true })}
                className="w-28 border-b border-white/20 bg-transparent py-2 font-sans text-4xl tabular-nums text-white focus:border-red-500 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-lg text-white/40">days</span>
            </div>
            {errors.days && <p className="mt-2 text-sm text-red-400/90">{errors.days.message}</p>}
          </motion.div>

          <motion.div variants={item}>
            <label htmlFor="reason" className="block text-xs font-medium uppercase tracking-widest text-white/40">
              Reason
            </label>
            <input
              id="reason"
              type="text"
              {...register('reason')}
              placeholder="Why does this matter to you?"
              maxLength={500}
              className="mt-3 w-full border-b border-white/20 bg-transparent py-2 text-lg text-white placeholder:text-white/25 focus:border-red-500 focus:outline-none"
            />
            {errors.reason && <p className="mt-2 text-sm text-red-400/90">{errors.reason.message}</p>}
          </motion.div>

          <motion.div variants={item}>
            <button type="submit" disabled={isSubmitting} className={blueClass}>
              {isSubmitting ? 'Setting target…' : 'Set target'}
            </button>
          </motion.div>
        </motion.form>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this target?"
        description={
          targetReason
            ? `You said: "${targetReason}" — this can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        confirming={deleting}
        onConfirm={handleDeleteTarget}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}