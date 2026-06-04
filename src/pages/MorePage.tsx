import { Link } from 'react-router-dom'
import { Wrench, DollarSign, FileText, Settings, LogOut, ChevronRight, Package, Repeat, Users, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'

export function MorePage() {
  const { signOut, profile, isTeamMember, user } = useAuth()

  const sections = [
    {
      title: 'Business',
      items: [
        { to: '/expenses', icon: DollarSign, label: 'Expenses', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
        { to: '/estimates', icon: FileText, label: 'Estimates', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
        { to: '/recurring', icon: Repeat, label: 'Recurring Schedules', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
      ]
    },
    {
      title: 'Equipment',
      items: [
        { to: '/equipment', icon: Package, label: 'Equipment', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
        { to: '/maintenance', icon: Wrench, label: 'Maintenance', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
      ]
    },
    {
      title: 'Account',
      items: [
        { to: '/team', icon: Users, label: 'Team & Employees', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400' },
        { to: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
      ]
    },
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="More" />

      {/* Profile card */}
      <div className="px-4 py-3">
        <div className="bg-green-600 dark:bg-green-800 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
              {profile?.full_name?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg">{profile?.full_name}</p>
              <p className="text-green-100 text-sm">{profile?.business_name}</p>
            </div>
            {isTeamMember ? (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                <Users className="w-3 h-3" />
                <span className="text-xs font-medium">Employee</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                <Crown className="w-3 h-3" />
                <span className="text-xs font-medium">Owner</span>
              </div>
            )}
          </div>
          {isTeamMember && (
            <p className="text-green-200 text-xs mt-2">Signed in as {user?.email}</p>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-4">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {section.items.map((item, i) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-red-600 dark:text-red-400">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
