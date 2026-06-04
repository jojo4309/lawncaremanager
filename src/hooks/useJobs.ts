import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ServiceJob } from '../types'
import { useAuth } from '../context/AuthContext'
import { format, addDays } from 'date-fns'

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
      // 1. Create the job
      const { data: created, error } = await supabase
        .from('jobs')
        .insert({ ...data, profile_id: user!.id })
        .select()
        .single()
      if (error) throw error

      // 2. Auto-create a draft invoice for this job
      try {
        // Get next invoice number
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('profile_id', user!.id)
        const nextNum = (existing?.length ?? 0) + 1
        const invoiceNumber = `INV-${String(nextNum).padStart(4, '0')}`

        const today = format(new Date(), 'yyyy-MM-dd')
        const dueDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .insert({
            profile_id: user!.id,
            customer_id: data.customer_id,
            invoice_number: invoiceNumber,
            status: 'draft',
            issue_date: today,
            due_date: dueDate,
            subtotal: data.price,
            tax_rate: 0,
            tax_amount: 0,
            total: data.price,
            paid_amount: 0,
          })
          .select()
          .single()

        if (!invErr && invoice) {
          // Add the job as a line item
          await supabase.from('invoice_line_items').insert({
            invoice_id: invoice.id,
            job_id: created.id,
            description: data.service_type || 'Lawn Service',
            quantity: 1,
            unit_price: data.price,
            total: data.price,
          })
        }
      } catch {
        // Invoice creation failing should not block the job save
      }

      return created
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
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
