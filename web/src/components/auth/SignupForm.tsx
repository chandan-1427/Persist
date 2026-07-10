import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/schemas/signupSchema'
import { cardClass, submitButtonClass } from '@/styles/formStyles'
import { FormField } from '@/components/form/FormField'
import { PasswordField } from '@/components/form/PasswordField'
import { Link } from 'react-router-dom'

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    // TODO: replace with real API call
    console.log('Signup data:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cardClass}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Create an account</h1>
          <p className="text-sm text-white/50">Get started in a few seconds</p>
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
  )
}