import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import SignInIll from '@/assets/SignInIll.svg'
import { signinSchema, type SigninFormData } from '@/schemas/signinSchema'
import { cardClass, submitButtonClass } from '@/styles/formStyles'
import { FormField } from '../form/FormField'
import { PasswordField } from '../form/PasswordField'
import { Link } from 'react-router-dom'
import { signin } from '@/lib/auth'
import { ApiError } from '@/lib/api'
import { useState } from 'react'

export function SigninForm() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  })

  const onSubmit = async (data: SigninFormData) => {
    setFormError(null)
    try {
      await signin(data)
      navigate('/')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center gap-24 px-6">      <img
      src={SignInIll}
      alt=""
      className="hidden w-full max-w-sm md:block"
    />
    
      <form onSubmit={handleSubmit(onSubmit)} className={cardClass}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-white/50">Sign in to your account</p>
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
            id="identifier"
            label="Email or Username"
            placeholder="example@gmail.com"
            autoComplete="username"
            register={register}
            error={errors.identifier}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            register={register}
            error={errors.password}
          />
          <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </fieldset>

        <p className="text-center text-sm text-white/50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-text hover:underline">
            Sign up
          </Link>
        </p>
      </form>

    </div>
  )
}