import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Phone, MapPin } from 'lucide-react'
import { useCustomers } from '../hooks/useCustomers'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function CustomersPage() {
  const { data: customers = [], isLoading } = useCustomers()
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} total`}
        actions={<Link to="/customers/new"><Button size="sm"><Plus className="w-4 h-4" />Add</Button></Link>}
      />

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search ? 'No customers found' : 'No customers yet'}
            description={search ? 'Try a different search' : 'Add your first customer to get started'}
            action={!search ? <Link to="/customers/new"><Button size="sm"><Plus className="w-4 h-4" />Add Customer</Button></Link> : undefined}
          />
        ) : (
          filtered.map(customer => (
            <Link key={customer.id} to={`/customers/${customer.id}`}>
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{customer.name}</p>
                      {customer.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{customer.city}, {customer.state}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 dark:text-green-300 font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
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
