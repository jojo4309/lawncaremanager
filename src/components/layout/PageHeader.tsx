import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, back, actions, className }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className={cn('sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-safe', className)}>
      <div className="flex items-center gap-3 h-14">
        {back && (
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
