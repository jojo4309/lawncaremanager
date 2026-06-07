import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { geocodeAddress } from '../lib/geocode'
import { MapPin, Plus, Pencil, Trash2, Navigation } from 'lucide-react'
import type { Property } from '../types'

const emptyPropForm = {
  name: 'Main Property',
  address: '',
  city: '',
  state: '',
  zip: '',
  lot_size_sqft: '',
  gate_code: '',
  notes: '',
}

export function CustomerFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const navigate = useNavigate()
  const { profileId } = useAuth()
  const qc = useQueryClient()

  const { data: existing } = useCustomer(id && id !== 'new' ? id : '')
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: ''
  })

  // Property modal state
  const [propModalOpen, setPropModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [propForm, setPropForm] = useState({ ...emptyPropForm })
  const [savingProp, setSavingProp] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [deletingPropId, setDeletingPropId] = useState<string | null>(null)

  const { data: properties = [], refetch: refetchProps } = useQuery({
    queryKey: ['properties-for-customer', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('customer_id', id!)
        .order('created_at', { ascending: true })
      return (data ?? []) as Property[]
    },
    enabled: isEdit && !!id,
  })

  useEffect(() => {
    if (existing) setForm({
      name: existing.name ?? '',
      email: existing.email ?? '',
      phone: existing.phone ?? '',
      address: existing.address ?? '',
      city: existing.city ?? '',
      state: existing.state ?? '',
      zip: existing.zip ?? '',
      notes: existing.notes ?? '',
    })
  }, [existing])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const setProp = (k: keyof typeof propForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPropForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isEdit && id) {
      await updateCustomer.mutateAsync({ id, ...form })
    } else {
      await createCustomer.mutateAsync(form)
    }
    navigate('/customers')
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this customer?')) return
    await deleteCustomer.mutateAsync(id)
    navigate('/customers')
  }

  function openAddProperty() {
    setEditingProperty(null)
    setPropForm({ ...emptyPropForm })
    setPropModalOpen(true)
  }

  function openEditProperty(p: Property) {
    setEditingProperty(p)
    setPropForm({
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip ?? '',
      lot_size_sqft: p.lot_size_sqft != null ? String(p.lot_size_sqft) : '',
      gate_code: p.gate_code ?? '',
      notes: p.notes ?? '',
    })
    setPropModalOpen(true)
  }

  async function handleGetCoords() {
    if (!propForm.address || !propForm.city) return
    setGeocoding(true)
    const coords = await geocodeAddress(propForm.address, propForm.city, propForm.state, propForm.zip)
    setGeocoding(false)
    if (coords) {
      // Store coords temporarily so they get saved with the property
      setPropForm(f => ({ ...f, _lat: String(coords.lat), _lng: String(coords.lng) } as any))
    } else {
      alert('Could not locate address. Check spelling and try again.')
    }
  }

  async function handleSaveProperty(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSavingProp(true)

    // Auto-geocode if address changed or no coords exist
    let lat: number | null = editingProperty?.lat ?? null
    let lng: number | null = editingProperty?.lng ?? null
    if (!lat || !lng || (editingProperty && propForm.address !== editingProperty.address)) {
      const coords = await geocodeAddress(propForm.address, propForm.city, propForm.state, propForm.zip)
      if (coords) { lat = coords.lat; lng = coords.lng }
    }

    const payload = {
      customer_id: id,
      profile_id: profileId!,
      name: propForm.name,
      address: propForm.address,
      city: propForm.city,
      state: propForm.state,
      zip: propForm.zip || null,
      lot_size_sqft: propForm.lot_size_sqft ? parseInt(propForm.lot_size_sqft) : null,
      gate_code: propForm.gate_code || null,
      notes: propForm.notes || null,
      lat,
      lng,
    }

    if (editingProperty) {
      await supabase.from('properties').update(payload).eq('id', editingProperty.id)
    } else {
      await supabase.from('properties').insert(payload)
    }

    setSavingProp(false)
    setPropModalOpen(false)
    qc.invalidateQueries({ queryKey: ['properties-for-customer', id] })
    refetchProps()
  }

  async function handleDeleteProperty(propId: string) {
    if (!confirm('Delete this property? Jobs linked to it will lose their location.')) return
    setDeletingPropId(propId)
    await supabase.from('properties').delete().eq('id', propId)
    setDeletingPropId(null)
    qc.invalidateQueries({ queryKey: ['properties-for-customer', id] })
    refetchProps()
  }

  const coordsKnown = (p: Property) => p.lat != null && p.lng != null

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title={isEdit ? 'Edit Customer' : 'New Customer'} back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="John Smith" required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Billing Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Street Address" value={form.address} onChange={set('address')} placeholder="123 Main St" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={form.city} onChange={set('city')} required />
              <Input label="State" value={form.state} onChange={set('state')} placeholder="TX" maxLength={2} required />
            </div>
            <Input label="ZIP Code" value={form.zip} onChange={set('zip')} placeholder="12345" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Textarea label="Notes" value={form.notes} onChange={set('notes')} placeholder="Customer preferences, special notes..." />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button type="submit" className="w-full" size="lg" loading={createCustomer.isPending || updateCustomer.isPending}>
            {isEdit ? 'Save Changes' : 'Add Customer'}
          </Button>
          {isEdit && (
            <Button type="button" variant="danger" className="w-full" onClick={handleDelete} loading={deleteCustomer.isPending}>
              Delete Customer
            </Button>
          )}
        </div>
      </form>

      {/* Properties section — only when editing */}
      {isEdit && (
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Service Properties ({properties.length})
            </p>
            <button
              onClick={openAddProperty}
              className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Property
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
              <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No service locations yet</p>
              <Button size="sm" type="button" onClick={openAddProperty}>
                <Plus className="w-4 h-4" /> Add Property
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {properties.map(p => (
                <Card key={p.id}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.name}</p>
                          {coordsKnown(p) ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                              <Navigation className="w-2.5 h-2.5" /> Located
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                              No coords
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.address}, {p.city}, {p.state} {p.zip}
                        </p>
                        {p.lot_size_sqft && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.lot_size_sqft.toLocaleString()} sq ft</p>
                        )}
                        {p.gate_code && (
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Gate: {p.gate_code}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditProperty(p)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(p.id)}
                          disabled={deletingPropId === p.id}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Property add/edit modal */}
      <Modal
        open={propModalOpen}
        onClose={() => setPropModalOpen(false)}
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        footer={
          <Button className="w-full" loading={savingProp} onClick={handleSaveProperty as any}>
            {editingProperty ? 'Save Changes' : 'Add Property'}
          </Button>
        }
      >
        <form onSubmit={handleSaveProperty} className="space-y-4">
          <Input
            label="Property Name"
            value={propForm.name}
            onChange={setProp('name')}
            placeholder="Main Property, Back House, Rental…"
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="ZIP" value={propForm.zip} onChange={setProp('zip')} placeholder="12345" />
            <Input label="Lot Size (sq ft)" type="number" value={propForm.lot_size_sqft} onChange={setProp('lot_size_sqft')} placeholder="5000" />
          </div>
          <Input label="Gate Code (optional)" value={propForm.gate_code} onChange={setProp('gate_code')} placeholder="#1234" />
          <Textarea label="Notes (optional)" value={propForm.notes} onChange={setProp('notes')} rows={2} placeholder="Dogs, parking, special access…" />

          <button
            type="button"
            onClick={handleGetCoords}
            disabled={geocoding || !propForm.address || !propForm.city}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            {geocoding ? 'Locating…' : 'Get Coordinates (for route optimizer)'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
