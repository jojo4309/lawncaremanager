import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCreateInvoice, useUpdateInvoice, useInvoice } from '../hooks/useInvoices'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { generateInvoicePDF } from '../lib/pdf'
import { generateInvoiceNumber, formatCurrency } from '../lib/utils'
import { Plus, Trash2, Download } from 'lucide-react'
import { format, addDays } from 'date-fns'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export function InvoiceFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const { data: existing } = useInvoice(isEdit ? id! : '')

  const [form, setForm] = useState({
    customer_id: '',
    invoice_number: '',
    status: 'draft',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tax_rate: '0',
    notes: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ])

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('profile_id', user!.id)
        .order('name')
      return data ?? []
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!isEdit && user) {
      supabase.from('invoices').select('id').eq('profile_id', user.id).then(({ data }) => {
        setForm(f => ({ ...f, invoice_number: generateInvoiceNumber(data?.length ?? 0) }))
      })
    }
  }, [isEdit, user])

  useEffect(() => {
    if (existing) {
      setForm({
        customer_id: existing.customer_id ?? '',
        invoice_number: existing.invoice_number ?? '',
        status: existing.status ?? 'draft',
        issue_date: existing.issue_date ?? '',
        due_date: existing.due_date ?? '',
        tax_rate: String(existing.tax_rate ?? 0),
        notes: existing.notes ?? '',
      })
      if (existing.line_items?.length) {
        setLineItems(existing.line_items.map(li => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          total: li.total,
        })))
      }
    }
  }, [existing])

  const subtotal = lineItems.reduce((s, li) => s + li.total, 0)
  const taxRate = parseFloat(form.tax_rate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  function updateLineItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems(items => items.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = Number(updated.quantity) * Number(updated.unit_price)
      }
      return updated
    }))
  }

  function addLineItem() {
    setLineItems(items => [...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  function removeLineItem(i: number) {
    setLineItems(items => items.filter((_, idx) => idx !== i))
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const invoiceData = {
      customer_id: form.customer_id,
      invoice_number: form.invoice_number,
      status: form.status as any,
      issue_date: form.issue_date,
      due_date: form.due_date,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      paid_amount: existing?.paid_amount ?? 0,
      notes: form.notes || undefined,
    }
    if (isEdit && id) {
      await updateInvoice.mutateAsync({ id, ...invoiceData })
    } else {
      await createInvoice.mutateAsync({ invoice: invoiceData as any, lineItems })
    }
    navigate('/invoices')
  }

  function handleDownloadPDF() {
    if (!existing || !profile) return
    generateInvoicePDF(existing, profile)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title={isEdit ? `Invoice ${form.invoice_number}` : 'New Invoice'}
        back
        actions={
          isEdit ? (
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4" />PDF
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Customer"
              value={form.customer_id}
              onChange={set('customer_id')}
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Select customer"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Invoice #" value={form.invoice_number} onChange={set('invoice_number')} required />
              <Select
                label="Status"
                value={form.status}
                onChange={set('status')}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Issue Date" type="date" value={form.issue_date} onChange={set('issue_date')} required />
              <Input label="Due Date" type="date" value={form.due_date} onChange={set('due_date')} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="ghost" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, i) => (
              <div key={i} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex gap-2">
                  <input
                    value={item.description}
                    onChange={e => updateLineItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1"
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Unit Price</label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={e => updateLineItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Total</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 py-1.5">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">Tax Rate (%)</span>
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={set('tax_rate')}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-20 text-sm text-right border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none"
                />
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax ({taxRate}%)</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Payment terms, thank you message..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={createInvoice.isPending || updateInvoice.isPending}
        >
          {isEdit ? 'Save Invoice' : 'Create Invoice'}
        </Button>
      </form>
    </div>
  )
}
