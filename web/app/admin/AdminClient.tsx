'use client'

import { useState } from 'react'
import { Dictionary } from '@/lib/i18n'

interface User {
  id: number
  email: string
  is_admin: number
  invited_by_code: string | null
  created_at: string
}

interface InvitationCode {
  id: number
  code: string
  name: string | null
  max_uses: number
  used_count: number
  is_active: number
  created_at: string
  expires_at: string | null
}

interface Settings {
  registrationEnabled: boolean
  invitationRequired: boolean
}

interface AdminClientProps {
  dict: Dictionary
  initialSettings: Settings
  initialUsers: User[]
  initialInvitationCodes: InvitationCode[]
}

export default function AdminClient({ dict, initialSettings, initialUsers, initialInvitationCodes }: AdminClientProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>(initialInvitationCodes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create invitation form state
  const [newInvitationName, setNewInvitationName] = useState('')
  const [newInvitationMaxUses, setNewInvitationMaxUses] = useState(1)
  const [newInvitationExpiry, setNewInvitationExpiry] = useState('')
  const [creatingInvitation, setCreatingInvitation] = useState(false)

  const toggleSetting = async (key: 'registrationEnabled' | 'invitationRequired') => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !settings[key] }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update settings')
        return
      }
      setSettings({
        registrationEnabled: data.registrationEnabled,
        invitationRequired: data.invitationRequired,
      })
    } catch {
      setError('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: number) => {
    if (!confirm(dict.admin.confirmDelete)) return
    setError('')
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete user')
        return
      }
      setUsers(users.filter(u => u.id !== userId))
    } catch {
      setError('Failed to delete user')
    }
  }

  const createInvitation = async () => {
    setError('')
    setCreatingInvitation(true)
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInvitationName || undefined,
          maxUses: newInvitationMaxUses,
          expiresAt: newInvitationExpiry || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create invitation code')
        return
      }
      setInvitationCodes([data.code, ...invitationCodes])
      setNewInvitationName('')
      setNewInvitationMaxUses(1)
      setNewInvitationExpiry('')
    } catch {
      setError('Failed to create invitation code')
    } finally {
      setCreatingInvitation(false)
    }
  }

  const toggleInvitation = async (codeId: number) => {
    setError('')
    try {
      const response = await fetch(`/api/admin/invitations/${codeId}`, { method: 'PUT' })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to toggle invitation code')
        return
      }
      setInvitationCodes(invitationCodes.map(c =>
        c.id === codeId ? { ...c, is_active: c.is_active === 1 ? 0 : 1 } : c
      ))
    } catch {
      setError('Failed to toggle invitation code')
    }
  }

  const deleteInvitation = async (codeId: number) => {
    if (!confirm(dict.admin.confirmDeleteInvitation)) return
    setError('')
    try {
      const response = await fetch(`/api/admin/invitations/${codeId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete invitation code')
        return
      }
      setInvitationCodes(invitationCodes.filter(c => c.id !== codeId))
    } catch {
      setError('Failed to delete invitation code')
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const getInvitationStatus = (code: InvitationCode): { label: string; color: string } => {
    if (code.is_active !== 1) {
      return { label: dict.admin.inactive, color: 'bg-zinc-500' }
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return { label: dict.admin.expired, color: 'bg-orange-500' }
    }
    if (code.max_uses > 0 && code.used_count >= code.max_uses) {
      return { label: dict.admin.exhausted, color: 'bg-red-500' }
    }
    return { label: dict.admin.active, color: 'bg-green-500' }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10 fade-in">
        <h1 className="font-orbitron text-3xl font-extrabold tracking-wide neon-text">
          {dict.admin.title}
        </h1>
      </div>

      {error && <div className="cyber-error mb-6">{error}</div>}

      {/* System Settings */}
      <div className="glass-card p-7 mb-8 slide-up stagger-1">
        <div className="section-header">
          <div className="section-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="section-title">{dict.admin.settings}</span>
        </div>

        {/* Registration Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/[0.05] mb-4">
          <div>
            <p className="font-semibold mb-1">{dict.admin.registration}</p>
            <p className="text-sm text-zinc-500">{dict.admin.registrationHint}</p>
          </div>
          <button
            onClick={() => toggleSetting('registrationEnabled')}
            disabled={loading}
            className={`relative w-14 h-7 rounded-full transition-all ${
              settings.registrationEnabled
                ? 'bg-green-500 shadow-[0_0_15px_rgba(0,255,136,0.5)]'
                : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                settings.registrationEnabled ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Invitation Required Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/[0.05]">
          <div>
            <p className="font-semibold mb-1">{dict.admin.invitationRequired}</p>
            <p className="text-sm text-zinc-500">{dict.admin.invitationRequiredHint}</p>
          </div>
          <button
            onClick={() => toggleSetting('invitationRequired')}
            disabled={loading || !settings.registrationEnabled}
            className={`relative w-14 h-7 rounded-full transition-all ${
              settings.invitationRequired
                ? 'bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
                : 'bg-zinc-700'
            } ${!settings.registrationEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                settings.invitationRequired ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 p-4 rounded-lg border border-white/[0.05] flex gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${settings.registrationEnabled ? 'bg-green-400 shadow-[0_0_10px_#00ff88]' : 'bg-red-400 shadow-[0_0_10px_#ff4444]'}`} />
            <span className="text-sm">
              {settings.registrationEnabled ? dict.admin.registrationOpen : dict.admin.registrationClosed}
            </span>
          </div>
          {settings.registrationEnabled && (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.invitationRequired ? 'bg-fuchsia-400 shadow-[0_0_10px_#d946ef]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} />
              <span className="text-sm">
                {settings.invitationRequired ? dict.admin.invitationRequiredOn : dict.admin.invitationRequiredOff}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Invitation Codes */}
      <div className="glass-card mb-8 slide-up stagger-2">
        <div className="p-5 border-b border-white/[0.08]">
          <div className="section-header !mb-0 !pb-0 !border-0">
            <div className="section-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <span className="section-title">{dict.admin.invitationCodes}</span>
          </div>
        </div>

        {/* Create Invitation Form */}
        <div className="p-5 border-b border-white/[0.08]">
          <p className="text-sm font-semibold mb-3">{dict.admin.createInvitation}</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={newInvitationName}
              onChange={(e) => setNewInvitationName(e.target.value)}
              className="cyber-input"
              placeholder={dict.admin.invitationNamePlaceholder}
            />
            <div>
              <input
                type="number"
                value={newInvitationMaxUses}
                onChange={(e) => setNewInvitationMaxUses(parseInt(e.target.value) || 0)}
                className="cyber-input"
                min="0"
                placeholder={dict.admin.maxUses}
              />
              <p className="text-xs text-zinc-500 mt-1">{dict.admin.maxUsesHint}</p>
            </div>
            <input
              type="datetime-local"
              value={newInvitationExpiry}
              onChange={(e) => setNewInvitationExpiry(e.target.value)}
              className="cyber-input"
            />
            <button
              onClick={createInvitation}
              disabled={creatingInvitation}
              className="cyber-btn flex items-center justify-center gap-2"
            >
              {creatingInvitation ? (
                <span className="cyber-spinner" />
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              {dict.dashboard.create}
            </button>
          </div>
        </div>

        {/* Invitation Codes List */}
        {invitationCodes.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p className="text-zinc-500 font-orbitron text-xs tracking-wider">{dict.admin.noInvitations}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-white/[0.08]">
                  <th className="p-4 font-medium">{dict.admin.code}</th>
                  <th className="p-4 font-medium">{dict.admin.invitationName}</th>
                  <th className="p-4 font-medium">{dict.admin.uses}</th>
                  <th className="p-4 font-medium">{dict.admin.status}</th>
                  <th className="p-4 font-medium">{dict.admin.expiresAt}</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invitationCodes.map((code) => {
                  const status = getInvitationStatus(code)
                  return (
                    <tr key={code.id} className="border-b border-white/[0.08] last:border-0 hover:bg-cyber-cyan/[0.02]">
                      <td className="p-4">
                        <button
                          onClick={() => copyCode(code.code)}
                          className="font-mono text-cyber-cyan hover:text-cyber-cyan/80 flex items-center gap-2"
                          title="Click to copy"
                        >
                          {code.code}
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="opacity-50">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </td>
                      <td className="p-4 text-sm">{code.name || '-'}</td>
                      <td className="p-4 text-sm">
                        {code.used_count} / {code.max_uses === 0 ? '∞' : code.max_uses}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${status.color}/20 text-white`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-zinc-500">
                        {code.expires_at ? formatDate(code.expires_at) : dict.admin.noExpiry}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => toggleInvitation(code.id)}
                            className={`px-3 py-1.5 rounded text-xs transition-colors ${
                              code.is_active === 1
                                ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            }`}
                          >
                            {code.is_active === 1 ? dict.admin.inactive : dict.admin.active}
                          </button>
                          <button
                            onClick={() => deleteInvitation(code.id)}
                            className="cyber-btn cyber-btn-danger !py-1.5 !px-3 !text-xs"
                          >
                            {dict.admin.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="glass-card slide-up stagger-3">
        <div className="p-5 border-b border-white/[0.08]">
          <div className="section-header !mb-0 !pb-0 !border-0">
            <div className="section-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="section-title">{dict.admin.users}</span>
            <span className="ml-auto text-sm text-zinc-500">{users.length} {dict.admin.total}</span>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-zinc-500 font-orbitron text-xs tracking-wider">{dict.admin.noUsers}</p>
          </div>
        ) : (
          <div>
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-5 border-b border-white/[0.08] last:border-0 hover:bg-cyber-cyan/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.is_admin ? 'bg-fuchsia-500/20 border border-fuchsia-500/50' : 'bg-cyber-cyan/10 border border-cyber-cyan/30'}`}>
                    {user.is_admin ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-fuchsia-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-cyber-cyan">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.email}</p>
                      {user.is_admin === 1 && (
                        <span className="px-2 py-0.5 text-[10px] font-orbitron font-bold bg-fuchsia-500/20 text-fuchsia-400 rounded border border-fuchsia-500/30">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {dict.admin.joined} {formatDate(user.created_at)}
                      {user.invited_by_code && (
                        <span className="ml-3 text-fuchsia-400">
                          {dict.admin.invitedBy} {user.invited_by_code}
                        </span>
                      )}
                      {!user.invited_by_code && user.is_admin !== 1 && (
                        <span className="ml-3 text-zinc-600">
                          {dict.admin.noInvitation}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {user.is_admin !== 1 && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="cyber-btn cyber-btn-danger !py-2 !px-4 !text-xs"
                  >
                    {dict.admin.delete}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
