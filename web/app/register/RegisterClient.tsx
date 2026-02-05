'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dictionary } from '@/lib/i18n'

interface RegisterClientProps {
  dict: Dictionary
  registrationEnabled: boolean
}

export default function RegisterClient({ dict, registrationEnabled }: RegisterClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Registration failed')
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
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="glass-card p-10 slide-up relative">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyber-cyan/30" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-fuchsia-500/30" />

          <div className="text-center mb-10">
            <Link href="/" className="font-orbitron text-3xl font-extrabold neon-text">
              HTML2PNG
            </Link>
            <h1 className="font-orbitron text-xl font-semibold mt-6 tracking-wider">
              {dict.auth.register}
            </h1>
          </div>

          {!registrationEnabled ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-orbitron text-lg font-semibold text-red-400 mb-3">
                {dict.auth.registrationDisabled}
              </h2>
              <p className="text-zinc-500 text-sm mb-8">
                {dict.auth.registrationDisabledHint}
              </p>
              <Link href="/login" className="cyber-btn inline-flex items-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {dict.auth.loginButton}
              </Link>
            </div>
          ) : (
            <>
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
                    minLength={8}
                    className="cyber-input"
                    placeholder={dict.auth.passwordPlaceholder}
                  />
                  <p className="text-xs text-zinc-500 mt-2">{dict.auth.passwordHint}</p>
                </div>

                <div>
                  <label className="cyber-label">{dict.auth.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="cyber-input"
                    placeholder={dict.auth.confirmPasswordPlaceholder}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  {dict.auth.registerButton}
                </button>
              </form>

              <p className="text-center mt-8 text-zinc-400">
                {dict.auth.hasAccount}{' '}
                <Link href="/login" className="text-cyber-cyan hover:underline font-medium">
                  {dict.auth.loginLink}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
