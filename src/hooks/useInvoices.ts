import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Invoice } from '../types'
import { useAuth } from '../context/AuthContext'

export function useInvoices() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*), line_items:invoice_line_items(*), payments(*)')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invoice[]
    },
    enabled: !!user,
  })
}

export function useInvoice(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*), line_items:invoice_line_items(*), payments(*)')
        .eq('id', id)
        .eq('profile_id', user!.id)
        .single()
      if (error) throw error
      return data as Invoice
    },
    enabled: !!user && !!id,
  })
}

export function useCreateInvoice() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { invoice: Omit<Invoice, 'id' | 'profile_id' | 'created_at' | 'line_items' | 'payments' | 'customer'>; lineItems: Array<{ description: string; quantity: number; unit_price: number; total: number; job_id?: string }> }) => {
      const { data: inv, error } = await supabase
        .from('invoices')
        .insert({ ...data.invoice, profile_id: user!.id })
        .select()
        .single()
      if (error) throw error
      if (data.lineItems.length > 0) {
        await supabase.from('invoice_line_items').insert(
          data.lineItems.map(li => ({ ...li, invoice_id: inv.id }))
        )
      }
      return inv
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })
}

export function useUpdateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Invoice> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoices', vars.id] })
    },
  })
}
