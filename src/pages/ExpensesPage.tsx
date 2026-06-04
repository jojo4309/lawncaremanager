import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate } from '../lib/utils'
import { Plus, DollarSign } from 'lucide-react'
import type { Expense, ExpenseCategory } from '../types'
import { format } from 'date-fns'

const CATEGORIES: ExpenseCategory[] = ['fuel', 'equipment', 'supplies', 'insurance', 'marketing', 'labor', 'other']

export function ExpensesPage() {
  const { profileId } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ category: 'fuel' as ExpenseCategory, description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd'), notes: '' })

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').eq('profile_id', profileId!).order('expense_date', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!profileId,
  })

  const createExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('expenses').insert({
        profile_id: profileId!,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        notes: form.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setModalOpen(false) },
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const totalThisMonth = expenses
    .filter(e => e.expense_date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((s, e) => s + e.amount, 0)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Expenses"
        back
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add</Button>}
      />

      <div className="px-4 py-3">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800">
          <p className="text-sm text-orange-700 dark:text-orange-300">This Month</p>
          <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{formatCurrency(totalThisMonth)}</p>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />)
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="w-8 h-8" />}
            title="No expenses yet"
            action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Expense</Button>}
          />
        ) : (
          expenses.map(expense => (
            <Card key={expense.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge status={expense.category} label={expense.category} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(expense.expense_date)}</span>
                    </div>
                  </div>
                  <p className="text-base font-bold text-red-600 dark:text-red-400">-{formatCurrency(expense.amount)}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense"
        footer={
          <Button className="w-full" loading={createExpense.isPending} onClick={() => createExpense.mutate()}>
            Save Expense
          </Button>
        }
      >
        <div className="space-y-4">
          <Select label="Category" value={form.category} onChange={set('category') as any} options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="e.g. Gas for mower" required />
          <Input label="Amount ($)" type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
          <Input label="Date" type="date" value={form.expense_date} onChange={set('expense_date')} required />
          <Textarea label="Notes (optional)" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </Modal>
    </div>
  )
}
