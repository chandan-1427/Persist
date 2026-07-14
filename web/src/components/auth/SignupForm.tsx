import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import SignUpIll from '@/assets/SignUpIll.svg'
import { signupSchema, type SignupFormData } from '@/schemas/signupSchema'
import { cardClass, submitButtonClass } from '@/styles/formStyles'
import { FormField } from '@/components/form/FormField'
import { PasswordField } from '@/components/form/PasswordField'
import { Link } from 'react-router-dom'
import { signup } from '@/lib/auth'
import { ApiError } from '@/lib/api'

export function SignupForm() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null)
    try {
      const { username, email, password } = data
      await signup({ username, email, password })
      navigate('/signin')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: err.message })
        setError('username', { message: err.message })
        return
      }
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center gap-24 px-6">      <img
        src={SignUpIll}
        alt=""
        className="hidden w-full max-w-sm md:block"
      />

        <form onSubmit={handleSubmit(onSubmit)} className={cardClass}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Create an account</h1>
              <p className="text-sm text-white/50">Get started in a few seconds</p>
            </div>
            <Link to="/" className="text-sm text-white/40 hover:text-white/70">
              Back
            </Link>
          </div>

          <fieldset disabled={isSubmitting} className="space-y-5">
            {formError && (
              <p role="alert" className="text-sm text-red-400">
                {formError}
              </p>
            )}

            <FormField
              id="username"
              label="Username"
              placeholder="demo_user"
              autoComplete="username"
              register={register}
              error={errors.username}
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="example@gmail.com"
              autoComplete="email"
              register={register}
              error={errors.email}
            />
            <PasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              register={register}
              error={errors.password}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              autoComplete="new-password"
              register={register}
              error={errors.confirmPassword}
            />

            <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </button>
          </fieldset>

          <p className="text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-text hover:underline">
              Sign in
            </Link>
          </p>
        </form>
        
    </div>
  )
}