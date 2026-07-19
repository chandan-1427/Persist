import { Link } from 'react-router-dom'
import fistImg from '@/assets/fist.jpg'
import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { blueClass, redClass } from '@/styles/buttonStyles'

interface GuestLandingProps {
  statusIndicator: ReactNode
}

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

export function GuestLanding({ statusIndicator }: GuestLandingProps) {
  return (
    <div className="text-text">
      {/* Hero section */}
      <div className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 md:px-16">
        {/* Dot grid — desktop only, right half, faded */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.25) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Journey path — draws itself in */}
        <svg
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block"
          viewBox="0 0 500 500"
          preserveAspectRatio="none"
        >
          <motion.polyline
            points="60,420 116,392 172,420 228,336 284,364 340,252 396,280 452,168"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.4 }}
          />

          {[
            { cx: 60, cy: 420, label: 'Day 1' },
            { cx: 116, cy: 392, label: null },
            { cx: 172, cy: 420, label: null },
            { cx: 228, cy: 336, label: 'Day 5' },
            { cx: 284, cy: 364, label: null },
            { cx: 340, cy: 252, label: 'Day 10' },
            { cx: 396, cy: 280, label: null },
            { cx: 452, cy: 168, label: 'Goal' },
          ].map(({ cx, cy, label }, i, arr) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.4 + (i / arr.length) * 1.8,
                ease: 'backOut',
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={i === arr.length - 1 ? 5 : 3.5}
                fill={i === arr.length - 1 ? '#ef4444' : 'rgba(255,255,255,0.7)'}
              />
              {label && (
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={label === 'Goal' ? 700 : 500}
                  fill={label === 'Goal' ? '#ef4444' : 'rgba(255,255,255,0.6)'}
                >
                  {label}
                </text>
              )}
            </motion.g>
          ))}
        </svg>

        <motion.div variants={container} initial="hidden" animate="show">
          <motion.h1
            variants={item}
            className="text-lg font-medium uppercase tracking-widest text-white/90"
          >
            Persist
          </motion.h1>

          <motion.div variants={item}>{statusIndicator}</motion.div>

          <motion.p
            variants={item}
            className="relative mt-6 max-w-5xl text-6xl font-bold leading-[1.1] tracking-tight text-white md:text-8xl"
          >
            Set your goal.
            <br />
            Beat it by beating
            <br />
            <span className="bg-red-800 text-white">second thoughts.</span>
          </motion.p>

        </motion.div>
      </div>

      {/* motivation section */}
      <div className="relative flex min-h-screen items-center overflow-hidden px-6 bg-red-800">
        <img
          src={fistImg}
          alt="Fist"
          className="rotate-270 absolute -left-64 top-1/2 w-[600px] max-w-none -translate-y-1/2 rounded-2xl object-cover blur-sm opacity-40 md:-left-45 md:w-[900px] md:blur-none md:opacity-100"
        />

        <div className="relative z-10 ml-auto w-full max-w-lg">
          <h2 className="text-2xl font-medium">How it works</h2>

          <ul className="mt-6 space-y-5 text-white">
            <li>
              <span className="font-medium">Set a timer.</span> Pick any
              duration — an hour, a week, a month, a year, even years — and commit to it.
            </li>
            <li>
              <span className="font-medium text-white">See your progress.</span> See
              how many days are left, or how many you've already completed.
            </li>
            <li>
              <span className="font-medium text-white">Built for the long haul.</span>{' '}
              Best suited for long-term goals — streaks, cooldowns, and commitments
              that need to survive longer than your motivation does on its own.
            </li>
            <li>
              <span className="font-medium text-white">Delete it if you want.</span> You're
              always free to walk away. But we remember the motivation behind why you
              started — and we'll remind you of it, every time you feel like quitting.
            </li>
          </ul>
        </div>
      </div>

      {/* CTA section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h2 className="mt-4 text-4xl leading-[1.1] text-white/80 border-b uppercase md:text-6xl">
          Can you challenge
          <br />
          yourself?
        </h2>

        <p className="mx-auto mt-6 max-w-md text-lg text-white/70">
          Set the timer. Commit to it. We'll remember why you started — even
          on the days you don't.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link to="/signup" className={blueClass}>
            Sign up
          </Link>
          <Link to="/signin" className={redClass}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}