import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMe, signout, signoutAll, type User } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { TargetTimer } from '@/components/timer/TargetTimer'

type ServerStatus = 'checking' | 'connected' | 'error'

export function LandingPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ServerStatus>('checking')
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [signingOut, setSigningOut] = useState<'one' | 'all' | null>(null)

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

  const handleSignout = async () => {
    setSigningOut('one')
    try {
      await signout()
      setUser(null)
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSigningOut(null)
    }
  }

  const handleSignoutAll = async () => {
    setSigningOut('all')
    try {
      await signoutAll()
      setUser(null)
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSigningOut(null)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-text">
      <h1 className="text-3xl font-semibold">Persist</h1>

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

      {!userLoading && user && (
        <p className="mt-4 text-sm text-white/60">
          Signed in as <span className="text-text font-medium">{user.username}</span> ({user.email})
        </p>
      )}

      {!userLoading && user && <TargetTimer />}

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

      <div className="mt-8 flex flex-wrap gap-4">
        {userLoading ? null : user ? (
          <>
            <button
              onClick={handleSignout}
              disabled={signingOut !== null}
              className="font-medium text-text border border-[#7C1C1C] py-2 px-3 bg-[#2C1C1A] hover:bg-[#8C1C1C] disabled:opacity-50"
            >
              {signingOut === 'one' ? 'Signing out...' : 'Sign out'}
            </button>
            <button
              onClick={handleSignoutAll}
              disabled={signingOut !== null}
              className="font-medium text-text border border-white/20 py-2 px-3 bg-white/5 hover:bg-white/10 disabled:opacity-50"
            >
              {signingOut === 'all' ? 'Signing out everywhere...' : 'Sign out of all devices'}
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="font-medium text-text border border-[#1C1C9F] py-2 px-3 bg-[#1C1C3A] hover:bg-[#1C1C8C]">
              Sign up
            </Link>
            <Link to="/signin" className="font-medium text-text border border-[#7C1C1C] py-2 px-3 bg-[#2C1C1A] hover:bg-[#8C1C1C]">
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}