'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dictionary } from '@/lib/i18n'

interface LoginClientProps {
  dict: Dictionary
}

export default function LoginClient({ dict }: LoginClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-70px)] flex items-center justify-center px-4 md:px-6 py-8">
      <div className="w-full max-w-md">
        <div className="glass-card p-6 md:p-10 slide-up relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-12 md:w-16 h-12 md:h-16 border-t-2 border-l-2 border-cyber-cyan/30" />
          <div className="absolute bottom-0 right-0 w-12 md:w-16 h-12 md:h-16 border-b-2 border-r-2 border-fuchsia-500/30" />

          <div className="text-center mb-8 md:mb-10">
            <Link href="/" className="font-orbitron text-2xl md:text-3xl font-extrabold neon-text">
              HTML2PNG
            </Link>
            <h1 className="font-orbitron text-lg md:text-xl font-semibold mt-5 md:mt-6 tracking-wider">
              {dict.auth.login}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="cyber-label">{dict.auth.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="cyber-input"
                placeholder={dict.auth.emailPlaceholder}
              />
            </div>

            <div>
              <label className="cyber-label">{dict.auth.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="cyber-input"
                placeholder={dict.auth.passwordPlaceholder}
              />
            </div>

            {error && <div className="cyber-error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="cyber-btn w-full flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="cyber-spinner" />
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              )}
              {dict.auth.loginButton}
            </button>
          </form>

          <p className="text-center mt-8 text-zinc-400">
            {dict.auth.noAccount}{' '}
            <Link href="/register" className="text-cyber-cyan hover:underline font-medium">
              {dict.auth.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
