'use client'

import { useState } from 'react'
import { Dictionary } from '@/lib/i18n'

interface User {
  id: number
  email: string
  is_admin: number
  created_at: string
}

interface Settings {
  registrationEnabled: boolean
}

interface AdminClientProps {
  dict: Dictionary
  initialSettings: Settings
  initialUsers: User[]
}

export default function AdminClient({ dict, initialSettings, initialUsers }: AdminClientProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleRegistration = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationEnabled: !settings.registrationEnabled }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update settings')
        return
      }
      setSettings({ registrationEnabled: data.registrationEnabled })
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
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

        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/[0.05]">
          <div>
            <p className="font-semibold mb-1">{dict.admin.registration}</p>
            <p className="text-sm text-zinc-500">{dict.admin.registrationHint}</p>
          </div>
          <button
            onClick={toggleRegistration}
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

        <div className="mt-4 p-4 rounded-lg border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${settings.registrationEnabled ? 'bg-green-400 shadow-[0_0_10px_#00ff88]' : 'bg-red-400 shadow-[0_0_10px_#ff4444]'}`} />
            <span className="text-sm">
              {settings.registrationEnabled ? dict.admin.registrationOpen : dict.admin.registrationClosed}
            </span>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="glass-card slide-up stagger-2">
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
