import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/layout/PageHeader'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export function SettingsPage() {
  const { profile, user, updateProfile } = useAuth()

  // Profile form
  const [form, setForm] = useState({ full_name: '', business_name: '', phone: '', business_address: '' })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password change form
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password reset email
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

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

  const setPw = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwForm(f => ({ ...f, [k]: e.target.value }))

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    await updateProfile(form)
    setProfileLoading(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwMessage(null)

    if (pwForm.newPw.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setPwLoading(true)

    // Re-authenticate with current password first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: pwForm.current,
    })

    if (signInErr) {
      setPwLoading(false)
      setPwMessage({ type: 'error', text: 'Current password is incorrect.' })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwLoading(false)

    if (error) {
      setPwMessage({ type: 'error', text: error.message })
    } else {
      setPwMessage({ type: 'success', text: 'Password updated successfully!' })
      setPwForm({ current: '', newPw: '', confirm: '' })
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/lawncaremanager/`,
    })
    setResetLoading(false)
    setResetSent(true)
    setTimeout(() => setResetSent(false), 5000)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="Settings" back />

      <div className="px-4 py-4 space-y-4">

        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email address</p>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-gray-100 select-all">{user?.email ?? '—'}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed here. Contact support if needed.</p>
            </div>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={setPw('current')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={setPw('newPw')}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={setPw('confirm')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Feedback message */}
              {pwMessage && (
                <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm ${
                  pwMessage.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {pwMessage.type === 'success'
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {pwMessage.text}
                </div>
              )}

              <Button type="submit" className="w-full" loading={pwLoading}>
                Update Password
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Send reset email */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Forgot your current password? Send a reset link to <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email}</span>
              </p>
              {resetSent ? (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Reset email sent — check your inbox
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  loading={resetLoading}
                  className="w-full"
                >
                  Send Password Reset Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile info */}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" size="lg" loading={profileLoading}>
            {profileSaved ? '✓ Saved!' : 'Save Profile'}
          </Button>
        </form>

      </div>
    </div>
  )
}
