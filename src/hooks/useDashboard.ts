import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'
import type { DashboardStats } from '../types'

export function useDashboard() {
  const { profileId } = useAuth()
  return useQuery({
    queryKey: ['dashboard', profileId],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
      const lastMonthStart = format(startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), 'yyyy-MM-dd')
      const lastMonthEnd = format(endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1)), 'yyyy-MM-dd')
      const weekStart = format(startOfWeek(now), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(now), 'yyyy-MM-dd')
      const nextWeek = format(addDays(now, 7), 'yyyy-MM-dd')
      const pid = profileId!

      const [
        { data: thisMonthJobs },
        { data: lastMonthJobs },
        { data: weekJobs },
        { data: todayJobs },
        { data: invoices },
        { data: customers },
        { data: upcomingJobs },
      ] = await Promise.all([
        supabase.from('jobs').select('price').eq('profile_id', pid).eq('status', 'completed').gte('completed_date', monthStart).lte('completed_date', monthEnd),
        supabase.from('jobs').select('price').eq('profile_id', pid).eq('status', 'completed').gte('completed_date', lastMonthStart).lte('completed_date', lastMonthEnd),
        supabase.from('jobs').select('id').eq('profile_id', pid).neq('status', 'cancelled').gte('scheduled_date', weekStart).lte('scheduled_date', weekEnd),
        supabase.from('jobs').select('id').eq('profile_id', pid).neq('status', 'cancelled').eq('scheduled_date', today),
        supabase.from('invoices').select('total, paid_amount').eq('profile_id', pid).in('status', ['sent', 'overdue']),
        supabase.from('customers').select('id').eq('profile_id', pid),
        supabase.from('jobs').select('*, property:properties(*, customer:customers(*))').eq('profile_id', pid).neq('status', 'cancelled').neq('status', 'completed').gte('scheduled_date', today).lte('scheduled_date', nextWeek).order('scheduled_date').limit(5),
      ])

      return {
        revenue_this_month: (thisMonthJobs ?? []).reduce((s, j) => s + (j.price || 0), 0),
        revenue_last_month: (lastMonthJobs ?? []).reduce((s, j) => s + (j.price || 0), 0),
        jobs_this_week: weekJobs?.length ?? 0,
        jobs_today: todayJobs?.length ?? 0,
        outstanding_invoices: (invoices ?? []).reduce((s, i) => s + (i.total - i.paid_amount), 0),
        active_customers: customers?.length ?? 0,
        upcoming_jobs: upcomingJobs ?? [],
      }
    },
    enabled: !!profileId,
    refetchInterval: 5 * 60 * 1000,
  })
}
