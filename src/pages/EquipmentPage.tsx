import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
// utils imported below as needed
import { Plus, Package, Wrench, ChevronRight } from 'lucide-react'
import type { Equipment } from '../types'
import { Link } from 'react-router-dom'

export function EquipmentPage() {
  const { profileId } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', model: '', serial_number: '', notes: '' })

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').eq('profile_id', profileId!).order('name')
      if (error) throw error
      return data as Equipment[]
    },
    enabled: !!profileId,
  })

  const createEquipment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('equipment').insert({ ...form, profile_id: profileId! })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); setModalOpen(false); setForm({ name: '', brand: '', model: '', serial_number: '', notes: '' }) },
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader
        title="Equipment"
        back
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add</Button>}
      />

      <div className="px-4 py-4 space-y-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />)
        ) : equipment.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No equipment yet"
            description="Track your mowers, trimmers, and other equipment"
            action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" />Add Equipment</Button>}
          />
        ) : (
          equipment.map(item => (
            <Link key={item.id} to={`/equipment/${item.id}`}>
              <Card className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {[item.brand, item.model].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Equipment"
        footer={
          <Button className="w-full" loading={createEquipment.isPending} onClick={() => createEquipment.mutate()}>
            Save Equipment
          </Button>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={set('name')} placeholder="e.g. John Deere Mower" required />
          <Input label="Brand" value={form.brand} onChange={set('brand')} placeholder="e.g. John Deere" />
          <Input label="Model" value={form.model} onChange={set('model')} placeholder="e.g. X370" />
          <Input label="Serial Number" value={form.serial_number} onChange={set('serial_number')} />
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
        </div>
      </Modal>
    </div>
  )
}
