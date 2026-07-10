import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

type ServerStatus = 'checking' | 'connected' | 'error'

export function LandingPage() {
  const [status, setStatus] = useState<ServerStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()

    const API_URL = import.meta.env.VITE_API_URL

    fetch(`${API_URL}/api/health`, { signal: controller.signal, })
      .then((res) => {
        if (!res.ok) throw new Error('Server responded with an error')
        return res.json()
      })
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'))

    return () => controller.abort()
  }, [])

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

      <div className="mt-8 flex gap-4">
        <Link to="/signup" className="font-medium text-text border border-[#1C1C9F] py-2 px-3 bg-[#1C1C3A] hover:bg-[#1C1C8C]">
          Sign up
        </Link>
        <Link to="/signin" className="font-medium text-text border border-[#7C1C1C] py-2 px-3 bg-[#2C1C1A] hover:bg-[#8C1C1C]">
          Sign in
        </Link>
      </div>
    </div>
  )
}