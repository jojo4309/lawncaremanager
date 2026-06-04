import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Users, UserPlus, Trash2, Crown, Shield, User, Copy, Check } from 'lucide-react'

interface TeamMember {
  id: string
  owner_profile_id: string
  member_user_id: string | null
  email: string
  role: 'admin' | 'member'
  status: 'pending' | 'active'
  invited_at: string
  joined_at: string | null
}

export function TeamPage() {
  const { user, profileId, isTeamMember, profile } = useAuth()
  const qc = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState(false)

  // Team members are only manageable by the account owner (not team members themselves)
  const isOwner = !isTeamMember

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_profile_id', profileId!)
        .order('invited_at', { ascending: false })
      if (error) throw error
      return data as TeamMember[]
    },
    enabled: !!profileId && isOwner,
  })

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'member' }) => {
      const { error } = await supabase.from('team_members').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    if (!inviteEmail.trim()) return
    if (inviteEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setInviteError("You can't invite yourself.")
      return
    }
    setInviting(true)
    const { error } = await supabase.from('team_members').insert({
      owner_profile_id: profileId!,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: 'pending',
    })
    setInviting(false)
    if (error) {
      setInviteError(error.message.includes('unique') ? 'This email has already been invited.' : error.message)
    } else {
      setInviteEmail('')
      qc.invalidateQueries({ queryKey: ['team'] })
    }
  }

  function copySignupLink() {
    const url = `${window.location.origin}/lawncaremanager/register`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const RoleIcon = ({ role }: { role: string }) =>
    role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />

  // If the current user is a team member (not owner), show read-only info
  if (isTeamMember) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
        <PageHeader title="Team" back />
        <div className="px-4 py-4">
          <Card>
            <CardContent className="py-6 text-center">
              <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {profile?.business_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You are a team member of this account. Only the account owner can manage team settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <PageHeader title="Team" back />

      <div className="px-4 py-4 space-y-4">
        {/* How it works */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">How team access works</p>
                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Enter your employee's email below and send them the signup link</li>
                  <li>They create an account with that exact email</li>
                  <li>They'll automatically see all your customers, jobs, and invoices</li>
                </ol>
                <button
                  onClick={copySignupLink}
                  className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy signup link to share'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invite form */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" />Invite Team Member</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-3">
              <Input
                label="Email address"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="employee@example.com"
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <div className="flex gap-2">
                  {(['member', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-1 justify-center ${
                        inviteRole === r
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <RoleIcon role={r} />
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {inviteRole === 'admin' ? 'Admin can view and edit everything.' : 'Member can view and update jobs.'}
                </p>
              </div>
              {inviteError && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {inviteError}
                </p>
              )}
              <Button type="submit" className="w-full" loading={inviting}>
                <UserPlus className="w-4 h-4" /> Send Invite
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Member list */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Team Members ({members.length})
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-xl animate-pulse border border-gray-200 dark:border-gray-800" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No team members yet"
              description="Invite an employee using the form above"
            />
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <Card key={m.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        m.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {m.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            status={m.status === 'active' ? 'active' : 'scheduled'}
                            label={m.status === 'active' ? 'Active' : 'Pending invite'}
                          />
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <RoleIcon role={m.role} />{m.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Toggle role */}
                        <button
                          onClick={() => updateRole.mutate({ id: m.id, role: m.role === 'admin' ? 'member' : 'admin' })}
                          className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 text-xs transition-colors"
                          title="Toggle role"
                        >
                          {m.role === 'admin' ? 'Make member' : 'Make admin'}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remove ${m.email} from your team?`)) removeMember.mutate(m.id) }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Owner card */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Account owner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
