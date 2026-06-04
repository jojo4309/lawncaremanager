import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, Wrench, Plus, CloudRain } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatCurrency, formatDate, formatTime } from '../lib/utils'

function StatCard({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'; color: string
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const { data: stats, isLoading } = useDashboard()

  const trend = stats
    ? stats.revenue_this_month >= stats.revenue_last_month ? 'up' : 'down'
    : 'neutral'

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="bg-green-600 dark:bg-green-800 pt-safe px-4 pb-6">
        <div className="flex items-center justify-between h-14">
          <div>
            <p className="text-green-100 text-sm">Good morning,</p>
            <h1 className="text-white text-xl font-bold">{profile?.full_name?.split(' ')[0] ?? 'there'} 👋</h1>
          </div>
          <Link to="/jobs/new">
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Plus className="w-4 h-4" /> New Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4 pb-4">
        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Revenue (Month)"
              value={formatCurrency(stats?.revenue_this_month ?? 0)}
              sub={stats?.revenue_last_month ? `vs ${formatCurrency(stats.revenue_last_month)} last mo` : undefined}
              icon={DollarSign}
              trend={trend}
              color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            />
            <StatCard
              label="Jobs This Week"
              value={String(stats?.jobs_this_week ?? 0)}
              sub={`${stats?.jobs_today ?? 0} today`}
              icon={Calendar}
              color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(stats?.outstanding_invoices ?? 0)}
              sub="in unpaid invoices"
              icon={DollarSign}
              color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            />
            <StatCard
              label="Customers"
              value={String(stats?.active_customers ?? 0)}
              icon={Users}
              color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            />
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { to: '/jobs/new', icon: Plus, label: 'Add Job', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
              { to: '/customers/new', icon: Users, label: 'Customer', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
              { to: '/invoices/new', icon: DollarSign, label: 'Invoice', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
              { to: '/expenses/new', icon: Wrench, label: 'Expense', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to} className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming jobs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upcoming Jobs</h2>
            <Link to="/schedule" className="text-xs text-green-600 dark:text-green-400 font-medium">View all</Link>
          </div>
          {!stats?.upcoming_jobs?.length ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {stats.upcoming_jobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`}>
                  <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {(job as any).property?.customer?.name ?? 'Customer'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {(job as any).property?.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(job.scheduled_date)}
                              {job.scheduled_time ? ` · ${formatTime(job.scheduled_time)}` : ''}
                            </span>
                            {job.status === 'rain_delay' && <CloudRain className="w-3 h-3 text-blue-500" />}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge status={job.status} />
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(job.price)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
