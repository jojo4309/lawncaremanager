import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCustomer, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export function CustomerFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const navigate = useNavigate()
  const { data: existing } = useCustomer(id && id !== 'new' ? id : '')
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: ''
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
          <CardContent className="pt-4 space-y-4">
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
    </div>
  )
}
