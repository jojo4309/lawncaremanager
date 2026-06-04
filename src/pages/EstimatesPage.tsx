import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../lib/utils'
import { FileText } from 'lucide-react'
import type { Estimate } from '../types'

export function EstimatesPage() {
  const { user } = useAuth()

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['estimates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimates')
        .select('*, customer:customers(*)')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Estimate[]
    },
    enabled: !!user,
  })

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="Estimates" back />

      <div className="px-4 py-4 space-y-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />
          ))
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No estimates yet"
            description="Create estimates for potential customers"
          />
        ) : (
          estimates.map(est => (
            <Card key={est.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{est.estimate_number}</span>
                      <Badge status={est.status} />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{est.customer?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valid until {formatDate(est.valid_until)}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(est.total)}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
