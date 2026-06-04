import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'
import { useAuth } from '../context/AuthContext'

export function useCustomers() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('profile_id', user!.id)
        .order('name')
      if (error) throw error
      return data as Customer[]
    },
    enabled: !!user,
  })
}

export function useCustomer(id: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, properties(*)')
        .eq('id', id)
        .eq('profile_id', user!.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user && !!id,
  })
}

export function useCreateCustomer() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Customer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) => {
      const { data: created, error } = await supabase
        .from('customers')
        .insert({ ...data, profile_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return created
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Customer> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from('customers')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return updated
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customers', vars.id] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
