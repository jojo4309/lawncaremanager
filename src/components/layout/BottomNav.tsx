import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, FileText, BarChart3, Menu } from 'lucide-react'
import { cn } from '../../lib/utils'

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/more', icon: Menu, label: 'More' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="grid grid-cols-6 h-14">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
