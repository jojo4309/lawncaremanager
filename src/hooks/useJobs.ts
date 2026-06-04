import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ServiceJob } from '../types'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

export function useJobs(filters?: { date?: string; status?: string }) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['jobs', user?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('jobs')
        .select('*, property:properties(*, customer:customers(*))')
        .eq('profile_id', user!.id)
        .order('scheduled_date', { ascending: true })
        .order('route_order', { ascending: true })

      if (filters?.date) q = q.eq('scheduled_date', filters.date)
      if (filters?.status) q = q.eq('status', filters.status)

      const { data, error } = await q
      if (error) throw error
      return data as ServiceJob[]
    },
    enabled: !!user,
  })
}

export function useTodayJobs() {
  return useJobs({ date: format(new Date(), 'yyyy-MM-dd') })
}

export function useCreateJob() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<ServiceJob, 'id' | 'profile_id' | 'created_at'>) => {
      const { data: created, error } = await supabase
        .from('jobs')
        .insert({ ...data, profile_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return created
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServiceJob> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('jobs')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}
