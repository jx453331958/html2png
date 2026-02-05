import { cookies } from 'next/headers'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth'
import Converter from '@/components/Converter'

export default async function Home() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)
  const user = await getCurrentUser()

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Hero */}
      <div className="text-center mb-10 md:mb-16 fade-in">
        <h1 className="font-orbitron text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide neon-text mb-3 md:mb-4">
          {dict.converter.title}
        </h1>
        <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto px-4 md:px-0">
          {dict.converter.subtitle}
        </p>
      </div>

      {/* Converter */}
      <Converter dict={dict} isLoggedIn={!!user} />
    </div>
  )
}
