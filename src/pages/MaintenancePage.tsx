import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../lib/utils'
import { Plus, Wrench, CheckCircle } from 'lucide-react'
import type { MaintenanceRecord } from '../types'
import { format } from 'date-fns'

export function MaintenancePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    equipment_id: '',
    description: '',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    cost: '',
    notes: '',
  })

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('equipment').select('id, name').eq('profile_id', user!.id)
      return data ?? []
    },
    enabled: !!user,
  })

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*, equipment(*)')
        .eq('profile_id', user!.id)
        .order('scheduled_date', { ascending: true })
      if (error) throw error
      return data as MaintenanceRecord[]
    },
    enabled: !!user,
  })

  const createRecord = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('maintenance_records').insert({
        profile_id: user!.id,
        equipment_id: form.equipment_id || null,
        description: form.description,
        status: 'scheduled',
        scheduled_date: form.scheduled_date,
        cost: form.cost ? parseFloat(form.cost) : null,
        notes: form.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      setModalOpen(false)
      setForm({ equipment_id: '', description: '', scheduled_date: format(new Date(), 'yyyy-MM-dd'), cost: '', notes: '' })
    },
  })

  const completeRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_records')
        .update({ status: 'completed', completed_date: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance'] }),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const today = format(new Date(), 'yyyy-MM-dd')
  const overdue = records.filter(r => r.status === 'scheduled' && r.scheduled_date < today)
  const upcoming = records.filter(r => r.status === 'scheduled' && r.scheduled_date >= today)
  const completed = records.filter(r => r.status === 'completed').slice(0, 10)

  function RecordCard({ record }: { record: MaintenanceRecord }) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{record.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{(record as any).equipment?.name ?? 'No equipment'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge status={record.status} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.scheduled_date)}</span>
                {record.cost != null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(record.cost)}</span>
                )}
              </div>
            </div>
            {record.status !== 'completed' && (
              <button
                onClick={() => completeRecord.mutate(record.id)}
                className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                title="Mark complete"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Maintenance"
        back
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add</Button>}
      />

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />
          ))
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-8 h-8" />}
            title="No maintenance records"
            description="Track service and maintenance for your equipment"
            action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Record</Button>}
          />
        ) : (
          <>
            {overdue.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                  Overdue ({overdue.length})
                </p>
                <div className="space-y-2">{overdue.map(r => <RecordCard key={r.id} record={r} />)}</div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Upcoming
                </p>
                <div className="space-y-2">{upcoming.map(r => <RecordCard key={r.id} record={r} />)}</div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Completed
                </p>
                <div className="space-y-2">{completed.map(r => <RecordCard key={r.id} record={r} />)}</div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Maintenance"
        footer={
          <Button className="w-full" loading={createRecord.isPending} onClick={() => createRecord.mutate()}>
            Save
          </Button>
        }
      >
        <div className="space-y-4">
          <Select
            label="Equipment (optional)"
            value={form.equipment_id}
            onChange={set('equipment_id')}
            options={equipment.map(e => ({ value: e.id, label: e.name }))}
            placeholder="Select equipment"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={set('description')}
            placeholder="e.g. Oil change, blade sharpening"
            required
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={form.scheduled_date}
            onChange={set('scheduled_date')}
            required
          />
          <Input
            label="Estimated Cost"
            type="number"
            step="0.01"
            value={form.cost}
            onChange={set('cost')}
            placeholder="0.00"
          />
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </Modal>
    </div>
  )
}
