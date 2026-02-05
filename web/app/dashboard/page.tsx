import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser, listApiKeys } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)
  const keys = listApiKeys(user.id)

  return <DashboardClient dict={dict} initialKeys={keys} />
}
