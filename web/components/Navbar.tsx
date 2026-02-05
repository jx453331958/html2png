'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dictionary } from '@/lib/i18n'

interface NavbarProps {
  dict: Dictionary
  locale: string
  user: { email: string } | null
}

export default function Navbar({ dict, locale, user }: NavbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const switchLocale = (newLocale: string) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 bg-[rgba(10,10,15,0.8)] backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto h-[70px] flex items-center justify-between">
        <Link href="/" className="font-orbitron text-2xl font-extrabold tracking-wider neon-text">
          HTML2PNG
        </Link>

        <div className="flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex bg-black/30 rounded-md p-0.5 border border-white/[0.08]">
            <button
              onClick={() => switchLocale('en')}
              className={`px-3 py-1.5 text-xs font-orbitron font-medium rounded transition-all ${
                locale === 'en'
                  ? 'bg-cyber-cyan text-cyber-bg shadow-[0_0_10px_rgba(0,245,255,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => switchLocale('zh')}
              className={`px-3 py-1.5 text-xs font-orbitron font-medium rounded transition-all ${
                locale === 'zh'
                  ? 'bg-cyber-cyan text-cyber-bg shadow-[0_0_10px_rgba(0,245,255,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              中文
            </button>
          </div>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="font-orbitron text-xs font-medium tracking-wider uppercase text-zinc-400 hover:text-cyber-cyan px-3 py-2 rounded transition-all hover:bg-cyber-cyan/10"
              >
                {dict.nav.dashboard}
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-white/[0.08] rounded-full text-sm text-zinc-400">
                <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_#00ff88]" />
                {user.email}
              </div>
              <button
                onClick={handleLogout}
                className="font-orbitron text-xs font-medium tracking-wider uppercase text-zinc-400 hover:text-cyber-cyan px-3 py-2 rounded transition-all hover:bg-cyber-cyan/10"
              >
                {dict.nav.logout}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-orbitron text-xs font-medium tracking-wider uppercase text-zinc-400 hover:text-cyber-cyan px-3 py-2 rounded transition-all hover:bg-cyber-cyan/10"
              >
                {dict.nav.login}
              </Link>
              <Link href="/register" className="cyber-btn !py-2.5 !px-5 !text-xs">
                {dict.nav.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
