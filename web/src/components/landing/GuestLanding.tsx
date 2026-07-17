// components/landing/GuestLanding.tsx
import { Link } from 'react-router-dom'
import { blueClass, redClass } from '@/styles/buttonStyles'
import type { ReactNode } from 'react'

interface GuestLandingProps {
  description: ReactNode
}

export function GuestLanding({ description }: GuestLandingProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 text-text">
      {description}
      <div className="mt-8 flex gap-4">
        <Link to="/signup" className={blueClass}>
          Sign up
        </Link>
        <Link to="/signin" className={redClass}>
          Sign in
        </Link>
      </div>
    </div>
  )
}