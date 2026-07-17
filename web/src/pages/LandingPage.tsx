// LandingPage.tsx
import { useEffect, useState } from 'react'
import { getMe, type User } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { PageSkeleton } from '@/components/layout/PageSkeleton'
import { GuestLanding } from '@/components/landing/GuestLanding'
import { AuthenticatedLanding } from '@/components/landing/AuthenticatedLanding'

type ServerStatus = 'checking' | 'connected' | 'error'

export function LandingPage() {
  const [status, setStatus] = useState<ServerStatus>('checking')
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const API_URL = import.meta.env.VITE_API_URL

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Server responded with an error')
        return res.json()
      })
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'))

    return () => controller.abort()
  }, [])

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error(err)
        }
        setUser(null)
      })
      .finally(() => setUserLoading(false))
  }, [])

  const statusIndicator = (
    <div className="mt-2 flex items-center gap-2 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'connected'
            ? 'bg-green-500'
            : status === 'error'
              ? 'bg-red-500'
              : 'bg-yellow-500'
        }`}
      />
      <span className="text-white/60">
        {status === 'checking' && 'Checking server...'}
        {status === 'connected' && 'Server is connected'}
        {status === 'error' && 'Server unavailable'}
      </span>
    </div>
  )

  const description = (
    <>
      <h1 className="text-3xl font-semibold">Persist</h1>
      {statusIndicator}
      <p className="mt-4 text-white/70">
        Set a timer for any duration — an hour, a week, even 21 days — and it keeps running
        no matter what. Close the tab, restart your phone, come back next month: the timer
        doesn't care. It's tracked against real time, not your browser session, so it's always
        accurate when you return.
      </p>
      <p className="mt-4 text-white/70">
        Useful for long-term commitments, streaks, cooldowns, or countdowns that need to survive
        longer than your device does.
      </p>
    </>
  )

  if (userLoading) {
    return <PageSkeleton />
  }

  if (!user) {
    return <GuestLanding description={description} />
  }

  return (
    <AuthenticatedLanding
      user={user}
      description={description}
      onSignedOut={() => setUser(null)}
    />
  )
}