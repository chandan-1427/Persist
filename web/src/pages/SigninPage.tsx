import { AuthLayout } from '@/components/layout/AuthLayout'
import { SigninForm } from '@/components/auth/SigninForm'

export function SigninPage() {
  return (
    <AuthLayout>
      <SigninForm />
    </AuthLayout>
  )
}