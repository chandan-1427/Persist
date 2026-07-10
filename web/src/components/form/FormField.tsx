import type { FieldError, UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { inputClass, labelClass, errorClass } from '@/styles/formStyles'

type FormFieldProps<T extends FieldValues> = {
  id: Path<T>
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
  register: UseFormRegister<T>
  error?: FieldError
}

export function FormField<T extends FieldValues>({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  register,
  error,
}: FormFieldProps<T>) {
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...register(id)}
        className={inputClass}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className={errorClass}>
          {error.message}
        </p>
      )}
    </div>
  )
}