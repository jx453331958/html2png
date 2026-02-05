import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth'
import LoginClient from './LoginClient'

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
