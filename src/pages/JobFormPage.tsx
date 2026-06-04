import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCreateJob, useUpdateJob, useDeleteJob } from '../hooks/useJobs'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import type { ServiceFrequency } from '../types'
import { format } from 'date-fns'

const SERVICE_TYPES = ['Mowing', 'Trimming', 'Fertilizing', 'Aeration', 'Leaf Removal', 'Mulching', 'Edging', 'Cleanup', 'Other']
const FREQUENCIES: { value: ServiceFrequency; label: string }[] = [
  { value: 'one_time', label: 'One Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function JobFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const createJob = useCreateJob()
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()

  const [form, setForm] = useState({
    customer_id: '',
    property_id: '',
    title: '',
    service_type: 'Mowing',
    frequency: 'one_time' as ServiceFrequency,
    status: 'scheduled' as const,
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    price: '',
    notes: '',
    route_order: '',
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('id, name').eq('profile_id', user!.id).order('name')
      return data ?? []
    },
    enabled: !!user,
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-for-customer', form.customer_id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, name, address').eq('customer_id', form.customer_id)
      return data ?? []
    },
    enabled: !!form.customer_id,
  })

  const { data: existingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await supabase.from('jobs').select('*').eq('id', id!).single()
      return data
    },
    enabled: isEdit && !!id,
  })

  useEffect(() => {
    if (existingJob) {
      setForm({
        customer_id: existingJob.customer_id ?? '',
        property_id: existingJob.property_id ?? '',
        title: existingJob.title ?? '',
        service_type: existingJob.service_type ?? 'Mowing',
        frequency: existingJob.frequency ?? 'one_time',
        status: existingJob.status ?? 'scheduled',
        scheduled_date: existingJob.scheduled_date ?? '',
        scheduled_time: existingJob.scheduled_time ?? '',
        price: String(existingJob.price ?? ''),
        notes: existingJob.notes ?? '',
        route_order: String(existingJob.route_order ?? ''),
      })
    }
  }, [existingJob])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      customer_id: form.customer_id,
      property_id: form.property_id,
      title: form.title || form.service_type,
      service_type: form.service_type,
      frequency: form.frequency,
      status: form.status,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time || undefined,
      price: parseFloat(form.price) || 0,
      notes: form.notes || undefined,
      route_order: form.route_order ? parseInt(form.route_order) : undefined,
      description: undefined,
      completed_date: undefined,
      duration_minutes: undefined,
      before_photos: undefined,
      after_photos: undefined,
    }
    if (isEdit) {
      await updateJob.mutateAsync({ id: id!, ...data })
    } else {
      await createJob.mutateAsync(data as any)
    }
    navigate('/schedule')
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this job?')) return
    await deleteJob.mutateAsync(id)
    navigate('/schedule')
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title={isEdit ? 'Edit Job' : 'New Job'} back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Select
              label="Customer"
              value={form.customer_id}
              onChange={set('customer_id')}
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select customer"
              required
            />
            {form.customer_id && (
              <Select
                label="Property"
                value={form.property_id}
                onChange={set('property_id')}
                options={properties.map(p => ({ value: p.id, label: `${p.name} - ${p.address}` }))}
                placeholder="Select property"
                required
              />
            )}
            <Select
              label="Service Type"
              value={form.service_type}
              onChange={set('service_type')}
              options={SERVICE_TYPES.map(s => ({ value: s, label: s }))}
            />
            <Select
              label="Frequency"
              value={form.frequency}
              onChange={set('frequency') as any}
              options={FREQUENCIES}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input label="Date" type="date" value={form.scheduled_date} onChange={set('scheduled_date')} required />
            <Input label="Time (optional)" type="time" value={form.scheduled_time} onChange={set('scheduled_time')} />
            <Input label="Price ($)" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="0.00" required />
            <Input label="Route Order (optional)" type="number" min="1" value={form.route_order} onChange={set('route_order')} placeholder="e.g. 1, 2, 3..." />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Textarea label="Notes" value={form.notes} onChange={set('notes')} placeholder="Job notes, special instructions..." rows={3} />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button type="submit" className="w-full" size="lg" loading={createJob.isPending || updateJob.isPending}>
            {isEdit ? 'Save Changes' : 'Schedule Job'}
          </Button>
          {isEdit && (
            <Button type="button" variant="danger" className="w-full" onClick={handleDelete} loading={deleteJob.isPending}>
              Delete Job
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
