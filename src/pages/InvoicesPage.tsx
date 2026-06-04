import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useInvoices } from '../hooks/useInvoices'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../lib/utils'
import type { InvoiceStatus } from '../types'

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue']

export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')

  const filtered = statusFilter === 'all' ? invoices : invoices.filter(i => i.status === statusFilter)
  const totals = {
    outstanding: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total - i.paid_amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Invoices"
        actions={<Link to="/invoices/new"><Button size="sm"><Plus className="w-4 h-4" />Create</Button></Link>}
      />

      {/* Summary cards */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Outstanding</p>
          <p className="text-xl font-bold text-orange-800 dark:text-orange-200 mt-0.5">{formatCurrency(totals.outstanding)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
          <p className="text-xs font-medium text-green-700 dark:text-green-300">Paid (All Time)</p>
          <p className="text-xl font-bold text-green-800 dark:text-green-200 mt-0.5">{formatCurrency(totals.paid)}</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {(['all', ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No invoices"
            description="Create your first invoice"
            action={<Link to="/invoices/new"><Button size="sm"><Plus className="w-4 h-4" />Create Invoice</Button></Link>}
          />
        ) : (
          filtered.map(invoice => (
            <Link key={invoice.id} to={`/invoices/${invoice.id}`}>
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{invoice.invoice_number}</p>
                        <Badge status={invoice.status} />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{invoice.customer?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due {formatDate(invoice.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</p>
                      {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total && (
                        <p className="text-xs text-green-600 dark:text-green-400">{formatCurrency(invoice.paid_amount)} paid</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
