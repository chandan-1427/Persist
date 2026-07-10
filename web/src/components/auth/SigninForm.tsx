import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signinSchema, type SigninFormData } from '@/schemas/signinSchema'
import { cardClass, submitButtonClass } from '@/styles/formStyles'
import { FormField } from '../form/FormField'
import { PasswordField } from '../form/PasswordField'
import { Link } from 'react-router-dom'

export function SigninForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
  })

  const onSubmit = async (data: SigninFormData) => {
    // TODO: replace with real API call
    console.log('Signin data:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cardClass}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-white/50">Sign in to your account</p>
        </div>

        <Link
          to="/"
          className="text-sm text-white/40 hover:text-white/70"
        >
          Back
        </Link>
      </div>

      <fieldset disabled={isSubmitting} className="space-y-5">

        <FormField 
          id='identifier'
          label='Email or Username'
          placeholder='example@gmail.com'
          autoComplete='username'
          register={register}
          error={errors.identifier}
        />

        <PasswordField 
          id='password'
          label='Password'
          autoComplete='current-password'
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
  )
}