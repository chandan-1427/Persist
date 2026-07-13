import { useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'
import { signout, signoutAll, type User } from '@/lib/auth'
import { redClass, whiteClass } from '@/styles/buttonStyles'

type SidebarProps = {
  user: User
  onSignedOut: () => void
  description: ReactNode
}

export function Sidebar({ user, onSignedOut, description }: SidebarProps) {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState<'one' | 'all' | null>(null)

  const handleSignout = async () => {
    setSigningOut('one')
    try {
      await signout()
      onSignedOut()
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
      onSignedOut()
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSigningOut(null)
    }
  }

  return (
    <>
      <div
        className={`shrink-0 overflow-hidden border-r border-white/10 transition-all duration-200 ${
          collapsed ? 'w-0 border-r-0' : 'w-[500px]'
        }`}
      >
        <div className="w-[500px] space-y-6 pr-10 pl-4 py-12 mt-5">
          {description}

          <div className="rounded border border-white/10 bg-white/5 p-5">
            <div className="space-y-1">
              <p className="font-medium text-text">{user.username}</p>
              <p className="text-sm text-white/50">{user.email}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={handleSignout}
                disabled={signingOut !== null}
                className={whiteClass}
              >
                {signingOut === 'one' ? 'Signing out…' : 'Sign out'}
              </button>
              <button
                onClick={handleSignoutAll}
                disabled={signingOut !== null}
                title="Sign out from all devices"
                className={redClass}
              >
                {signingOut === 'all' ? 'Signing out…' : 'Sign out all'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute left-3 top-3 z-20 flex h-8 w-8 
          items-center justify-center rounded border border-white/10 bg-white/5 
          text-white/50 hover:bg-white/10 hover:text-white/80
          active:translate-y-px active:shadow-sm"
        aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
      >
        {collapsed ? '»' : '«'}
      </button>
    </>
  )
}