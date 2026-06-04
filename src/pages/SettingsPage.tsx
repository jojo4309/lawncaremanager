import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export function SettingsPage() {
  const { profile, updateProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', business_name: '', phone: '', business_address: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? '',
      business_name: profile.business_name ?? '',
      phone: profile.phone ?? '',
      business_address: profile.business_address ?? '',
    })
  }, [profile])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await updateProfile(form)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="Settings" back />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Your Name" value={form.full_name} onChange={set('full_name')} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Business</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Business Name" value={form.business_name} onChange={set('business_name')} />
            <Input label="Business Address" value={form.business_address} onChange={set('business_address')} />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
