import { useState } from 'react'
import type { FieldError, UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { inputClass, labelClass, errorClass } from '@/styles/formStyles'

type PasswordFieldProps<T extends FieldValues> = {
  id: Path<T>
  label: string
  autoComplete: string
  register: UseFormRegister<T>
  error?: FieldError
}

export function PasswordField<T extends FieldValues>({
  id,
  label,
  autoComplete,
  register,
  error,
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder="********"
          autoComplete={autoComplete}
          {...register(id)}
          className={`${inputClass} pr-14`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-3 text-xs font-medium text-white/40 hover:text-white/70"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && (
        <p id={errorId} className={errorClass}>
          {error.message}
        </p>
      )}
    </div>
  )
}