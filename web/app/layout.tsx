import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import Background from '@/components/Background'
import Navbar from '@/components/Navbar'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser, initializeAdmin } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'HTML2PNG - Convert HTML to High-Quality Images',
  description: 'Convert your HTML content to high-quality PNG images with customizable options',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize admin account from env if not exists
  await initializeAdmin()

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)
  const user = await getCurrentUser()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen">
        <Background />
        <Navbar dict={dict} locale={locale} user={user} />
        <main className="pt-[70px]">
          {children}
        </main>
      </body>
    </html>
  )
}
