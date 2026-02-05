import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to HTML2PNG to convert HTML to high-quality PNG images',
}

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)

  return <LoginClient dict={dict} />
}
