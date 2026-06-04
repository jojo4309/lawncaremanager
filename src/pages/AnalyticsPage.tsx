import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '../lib/utils'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed']

export function AnalyticsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'6m' | '12m'>('6m')

  const { data: analytics } = useQuery({
    queryKey: ['analytics', user?.id, period],
    queryFn: async () => {
      const months = period === '6m' ? 6 : 12
      const now = new Date()

      const monthlyData = await Promise.all(
        Array.from({ length: months }, (_, i) => {
          const d = subMonths(now, months - 1 - i)
          return supabase
            .from('jobs')
            .select('price, service_type')
            .eq('profile_id', user!.id)
            .eq('status', 'completed')
            .gte('completed_date', format(startOfMonth(d), 'yyyy-MM-dd'))
            .lte('completed_date', format(endOfMonth(d), 'yyyy-MM-dd'))
            .then(({ data }) => ({
              month: format(d, 'MMM'),
              revenue: (data ?? []).reduce((s, j) => s + (j.price || 0), 0),
              jobs: (data ?? []).length,
            }))
        })
      )

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('profile_id', user!.id)
        .gte('expense_date', format(subMonths(now, months), 'yyyy-MM-dd'))

      const expenseByCategory = (expenseData ?? []).reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      }, {} as Record<string, number>)

      const expenseChartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

      const { data: serviceData } = await supabase
        .from('jobs')
        .select('service_type, price')
        .eq('profile_id', user!.id)
        .eq('status', 'completed')
        .gte('completed_date', format(subMonths(now, months), 'yyyy-MM-dd'))

      const revenueByService = (serviceData ?? []).reduce((acc, j) => {
        acc[j.service_type] = (acc[j.service_type] || 0) + (j.price || 0)
        return acc
      }, {} as Record<string, number>)

      const serviceChartData = Object.entries(revenueByService).map(([name, value]) => ({ name, value }))

      return { monthlyData, expenseChartData, serviceChartData }
    },
    enabled: !!user,
  })

  const totalRevenue = analytics?.monthlyData.reduce((s, m) => s + m.revenue, 0) ?? 0
  const totalJobs = analytics?.monthlyData.reduce((s, m) => s + m.jobs, 0) ?? 0

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="Analytics" />

      <div className="px-4 py-3 space-y-4">
        {/* Period toggle */}
        <div className="flex gap-2">
          {(['6m', '12m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {p === '6m' ? '6 Months' : '12 Months'}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Jobs Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalJobs}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics?.monthlyData ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs per month */}
        <Card>
          <CardHeader><CardTitle>Jobs Completed</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={analytics?.monthlyData ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="jobs" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by service */}
        {analytics?.serviceChartData && analytics.serviceChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Revenue by Service</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={analytics.serviceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {analytics.serviceChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Expenses breakdown */}
        {analytics?.expenseChartData && analytics.expenseChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics.expenseChartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="value" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
