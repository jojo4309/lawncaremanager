import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900',
          'border-gray-300 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500',
          'focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'
