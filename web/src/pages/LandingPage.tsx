import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMe, type User } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { TargetTimer } from '@/components/timer/TargetTimer'

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

  // Logged out: original single-column centered layout, unchanged
  if (!userLoading && !user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-text">
        {description}
        <div className="mt-8 flex gap-4">
          <Link
            to="/signup"
            className="border border-[#2A2AAD] bg-[#1C1C3A] py-2 px-4 text-md font-medium text-text shadow-sm shadow-black/20 transition-all hover:border-[#2A2AAD] hover:bg-[#26269C] hover:shadow-md hover:shadow-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3535C4] active:translate-y-px active:shadow-sm"
          >
            Sign up
          </Link>
          <Link
            to="/signin"
            className="border border-[#7C1C1C] bg-[#2C1C1A] py-2 px-4 text-md font-medium text-text shadow-sm shadow-black/20 transition-all hover:border-[#7C1C1C] hover:bg-[#8C1C1C] hover:shadow-md hover:shadow-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3535C4] active:translate-y-px active:shadow-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  // Loading: avoid flashing either layout before we know auth state
  if (userLoading) {
    return <div className="min-h-screen" />
  }

  // Logged in: sidebar owns its own collapse state and account UI
  return (
    <div className="flex min-h-screen">
      {user && (
        <Sidebar user={user} onSignedOut={() => setUser(null)} description={description} />
      )}

      <div className="relative flex flex-1 items-center justify-center">
        {user && <TargetTimer />}
      </div>
    </div>
  )
}