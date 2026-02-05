'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dictionary } from '@/lib/i18n'

interface ApiKey {
  id: number
  key_prefix: string
  name: string | null
  created_at: string
  last_used_at: string | null
}

interface DashboardClientProps {
  dict: Dictionary
  initialKeys: ApiKey[]
}

export default function DashboardClient({ dict, initialKeys }: DashboardClientProps) {
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const loadKeys = async () => {
    const response = await fetch('/api/keys')
    const data = await response.json()
    setKeys(data.keys || [])
  }

  const createKey = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || undefined }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to create API key')
        return
      }
      setNewKey(data.key.key)
      setNewKeyName('')
      await loadKeys()
    } catch {
      setError('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const deleteKey = async (id: number) => {
    if (!confirm(dict.dashboard.confirmDelete)) return
    try {
      await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      await loadKeys()
    } catch {
      setError('Failed to delete API key')
    }
  }

  const copyKey = async () => {
    if (newKey) {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10 fade-in">
        <h1 className="font-orbitron text-3xl font-extrabold tracking-wide neon-text">
          {dict.dashboard.title}
        </h1>
      </div>

      {/* Create API Key */}
      <div className="glass-card p-7 mb-8 slide-up stagger-1">
        <div className="section-header">
          <div className="section-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="section-title">{dict.dashboard.createKey}</span>
        </div>

        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="cyber-input flex-1 min-w-[200px]"
            placeholder={dict.dashboard.keyNamePlaceholder}
          />
          <button
            onClick={createKey}
            disabled={loading}
            className="cyber-btn flex items-center gap-3"
          >
            {loading ? (
              <span className="cyber-spinner" />
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
            {dict.dashboard.create}
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-3">{dict.dashboard.keyHint}</p>
      </div>

      {error && <div className="cyber-error mb-6">{error}</div>}

      {/* API Keys List */}
      <div className="glass-card slide-up stagger-2">
        <div className="p-5 border-b border-white/[0.08]">
          <div className="section-header !mb-0 !pb-0 !border-0">
            <div className="section-icon">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <span className="section-title">{dict.dashboard.yourKeys}</span>
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p className="text-zinc-500 font-orbitron text-xs tracking-wider">{dict.dashboard.noKeys}</p>
          </div>
        ) : (
          <div>
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-5 border-b border-white/[0.08] last:border-0 hover:bg-cyber-cyan/[0.02] transition-colors"
              >
                <div>
                  <p className="font-semibold mb-1">{key.name || dict.dashboard.unnamed}</p>
                  <p className="font-mono text-sm text-cyber-cyan">{key.key_prefix}</p>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    {dict.dashboard.created} {formatDate(key.created_at)}
                    {key.last_used_at && (
                      <span className="ml-4">
                        {dict.dashboard.lastUsed} {formatDate(key.last_used_at)}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="cyber-btn cyber-btn-danger !py-2 !px-4 !text-xs"
                >
                  {dict.dashboard.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Usage */}
      <div className="glass-card p-7 mt-8 slide-up stagger-3">
        <div className="section-header">
          <div className="section-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="section-title">{dict.dashboard.usage}</span>
        </div>

        <div className="cyber-code">
          <pre>
            <span className="cmd">curl</span> -X POST https://your-domain.com/api/convert \{'\n'}
            {'  '}-H <span className="string">&quot;X-API-Key: h2p_your_api_key&quot;</span> \{'\n'}
            {'  '}-H <span className="string">&quot;Content-Type: application/json&quot;</span> \{'\n'}
            {'  '}-d <span className="string">&apos;{'{\n'}
            {'    '}&quot;html&quot;: &quot;&lt;h1&gt;Hello World&lt;/h1&gt;&quot;,{'\n'}
            {'    '}&quot;width&quot;: <span className="param">1200</span>,{'\n'}
            {'    '}&quot;dpr&quot;: <span className="param">2</span>{'\n'}
            {'  }'}&apos;</span> \{'\n'}
            {'  '}--output screenshot.png
          </pre>
        </div>
      </div>

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="glass-card p-8 max-w-lg w-full animate-[slideUp_0.3s_ease]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-orbitron font-semibold text-green-400">{dict.dashboard.keyCreated}</h3>
              <button
                onClick={() => setNewKey(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-5">{dict.dashboard.keyWarning}</p>

            <div className="key-display">{newKey}</div>

            <button
              onClick={copyKey}
              className="cyber-btn w-full mt-5 flex items-center justify-center gap-3"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? dict.dashboard.copied : dict.dashboard.copy}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
