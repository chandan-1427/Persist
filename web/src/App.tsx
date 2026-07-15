import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Footer } from '@/components/layout/Footer'

const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const SignupPage = lazy(() => import('@/pages/SignupPage').then(m => ({ default: m.SignupPage })))
const SigninPage = lazy(() => import('@/pages/SigninPage').then(m => ({ default: m.SigninPage })))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </BrowserRouter>
  )
}