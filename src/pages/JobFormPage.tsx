import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCreateJob, useUpdateJob, useDeleteJob } from '../hooks/useJobs'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import type { ServiceFrequency } from '../types'
import { format } from 'date-fns'
import { Plus, Home } from 'lucide-react'

const SERVICE_TYPES = [
  'Mowing', 'Edging', 'Weed Eating', 'Mulching',
  'Trimming', 'Fertilizing', 'Aeration', 'Leaf Removal',
  'Cleanup', 'Overseeding', 'Irrigation', 'Other',
]

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
  const { profileId } = useAuth()
  const qc = useQueryClient()

  const createJob = useCreateJob()
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()

  const [selectedServices, setSelectedServices] = useState<string[]>(['Mowing'])
  const [form, setForm] = useState({
    customer_id: '',
    property_id: '',
    frequency: 'one_time' as ServiceFrequency,
    status: 'scheduled' as const,
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: '',
    price: '',
    notes: '',
    route_order: '',
  })

  // Inline property creation state
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [propForm, setPropForm] = useState({
    name: 'Main Property', address: '', city: '', state: '', zip: '', gate_code: '', notes: ''
  })
  const [savingProperty, setSavingProperty] = useState(false)

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list', profileId],
    queryFn: async () => {
      const { data } = await supabase.from('customers').select('id, name').eq('profile_id', profileId!).order('name')
      return data ?? []
    },
    enabled: !!profileId,
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

  // When customer changes, auto-select first property if only one exists
  useEffect(() => {
    if (properties.length === 1 && !isEdit) {
      setForm(f => ({ ...f, property_id: properties[0].id }))
    } else if (properties.length === 0 && form.customer_id && !isEdit) {
      setForm(f => ({ ...f, property_id: '' }))
    }
  }, [properties, isEdit])

  useEffect(() => {
    if (existingJob) {
      // Parse comma-separated service types stored in db
      const services = existingJob.service_type
        ? existingJob.service_type.split(', ').filter(Boolean)
        : ['Mowing']
      setSelectedServices(services)
      setForm({
        customer_id: existingJob.customer_id ?? '',
        property_id: existingJob.property_id ?? '',
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

  function toggleService(type: string) {
    setSelectedServices(prev =>
      prev.includes(type)
        ? prev.length === 1 ? prev  // keep at least one
          : prev.filter(s => s !== type)
        : [...prev, type]
    )
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const setProp = (k: keyof typeof propForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPropForm(f => ({ ...f, [k]: e.target.value }))

  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_id) return
    setSavingProperty(true)
    const { data, error } = await supabase.from('properties').insert({
      customer_id: form.customer_id,
      profile_id: profileId!,
      name: propForm.name,
      address: propForm.address,
      city: propForm.city,
      state: propForm.state,
      zip: propForm.zip || null,
      gate_code: propForm.gate_code || null,
      notes: propForm.notes || null,
    }).select().single()
    setSavingProperty(false)
    if (!error && data) {
      await qc.invalidateQueries({ queryKey: ['properties-for-customer', form.customer_id] })
      setForm(f => ({ ...f, property_id: data.id }))
      setShowAddProperty(false)
      setPropForm({ name: 'Main Property', address: '', city: '', state: '', zip: '', gate_code: '', notes: '' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const serviceTypeStr = selectedServices.join(', ')
    const data = {
      customer_id: form.customer_id,
      property_id: form.property_id,
      title: serviceTypeStr,
      service_type: serviceTypeStr,
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

  const selectedCustomer = customers.find(c => c.id === form.customer_id)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title={isEdit ? 'Edit Job' : 'New Job'} back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Customer & Property */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Select
              label="Customer"
              value={form.customer_id}
              onChange={e => {
                setForm(f => ({ ...f, customer_id: e.target.value, property_id: '' }))
              }}
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select customer"
              required
            />

            {form.customer_id && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Property</label>
                {properties.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center">
                    <Home className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      No properties for {selectedCustomer?.name}
                    </p>
                    <Button type="button" size="sm" onClick={() => setShowAddProperty(true)}>
                      <Plus className="w-4 h-4" /> Add Property
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {properties.map(p => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          form.property_id === p.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="property_id"
                          value={p.id}
                          checked={form.property_id === p.id}
                          onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                          className="accent-green-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.address}</p>
                        </div>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddProperty(true)}
                      className="w-full text-sm text-green-600 dark:text-green-400 font-medium py-2 border border-dashed border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another property
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service types — multi-select pills */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select all that apply — {selectedServices.length} selected
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map(type => {
                const active = selectedServices.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleService(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      active
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400'
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}{type}
                  </button>
                )
              })}
            </div>
            {selectedServices.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Job title: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedServices.join(', ')}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader><CardTitle>Schedule & Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Frequency"
              value={form.frequency}
              onChange={set('frequency') as any}
              options={FREQUENCIES}
            />
            <Input label="Date" type="date" value={form.scheduled_date} onChange={set('scheduled_date')} required />
            <Input label="Time (optional)" type="time" value={form.scheduled_time} onChange={set('scheduled_time')} />
            <Input label="Price ($)" type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="0.00" required />
            <Input label="Route Order (optional)" type="number" min="1" value={form.route_order} onChange={set('route_order')} placeholder="e.g. 1, 2, 3…" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Textarea label="Notes" value={form.notes} onChange={set('notes')} placeholder="Job notes, special instructions…" rows={3} />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!form.property_id || selectedServices.length === 0}
            loading={createJob.isPending || updateJob.isPending}
          >
            {isEdit ? 'Save Changes' : 'Schedule Job'}
          </Button>
          {isEdit && (
            <Button type="button" variant="danger" className="w-full" onClick={handleDelete} loading={deleteJob.isPending}>
              Delete Job
            </Button>
          )}
        </div>
      </form>

      {/* Add Property Modal */}
      <Modal
        open={showAddProperty}
        onClose={() => setShowAddProperty(false)}
        title={`Add Property — ${selectedCustomer?.name ?? ''}`}
        footer={
          <Button className="w-full" loading={savingProperty} onClick={handleAddProperty as any}>
            Save Property
          </Button>
        }
      >
        <form onSubmit={handleAddProperty} className="space-y-4">
          <Input
            label="Property Name"
            value={propForm.name}
            onChange={setProp('name')}
            placeholder="e.g. Main Property, Rental House"
          />
          <Input
            label="Street Address"
            value={propForm.address}
            onChange={setProp('address')}
            placeholder="123 Oak St"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={propForm.city} onChange={setProp('city')} required />
            <Input label="State" value={propForm.state} onChange={setProp('state')} placeholder="TX" maxLength={2} required />
          </div>
          <Input label="ZIP" value={propForm.zip} onChange={setProp('zip')} placeholder="12345" />
          <Input label="Gate Code (optional)" value={propForm.gate_code} onChange={setProp('gate_code')} placeholder="e.g. #1234" />
          <Textarea label="Property Notes (optional)" value={propForm.notes} onChange={setProp('notes')} rows={2} placeholder="Parking, dogs, special access…" />
        </form>
      </Modal>
    </div>
  )
}
