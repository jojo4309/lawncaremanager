import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', business_name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUp(form.email, form.password, {
      full_name: form.full_name,
      business_name: form.business_name,
      phone: form.phone,
    })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Get Started</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create your lawn care account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Your Name" value={form.full_name} onChange={update('full_name')} placeholder="John Morgan" required />
            <Input label="Business Name" value={form.business_name} onChange={update('business_name')} placeholder="Morgan Lawn Services" required />
            <Input label="Phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="(555) 000-0000" />
            <Input label="Email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" required />
            <Input label="Password" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" autoComplete="new-password" required />
            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Have an account?{' '}
            <Link to="/login" className="text-green-600 dark:text-green-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
