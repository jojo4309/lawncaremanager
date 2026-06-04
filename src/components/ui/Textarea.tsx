import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900',
          'border-gray-300 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500',
          'focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors resize-none',
          'placeholder:text-gray-400 dark:placeholder:text-gray-600',
          error && 'border-red-500',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'
