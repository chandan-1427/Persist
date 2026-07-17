// components/landing/AuthenticatedLanding.tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { TargetTimer } from '@/components/timer/TargetTimer'
import type { User } from '@/lib/auth'
import type { ReactNode } from 'react'

interface AuthenticatedLandingProps {
  user: User
  description: ReactNode
  onSignedOut: () => void
}

export function AuthenticatedLanding({ user, description, onSignedOut }: AuthenticatedLandingProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onSignedOut={onSignedOut} description={description} />

      <div className="relative flex flex-1 items-center justify-center">
        <TargetTimer />
      </div>
    </div>
  )
}