import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser, isUserAdmin, initializeAdmin } from '@/lib/auth'
import { isRegistrationEnabled, getAllUsers } from '@/lib/db'
import AdminClient from './AdminClient'

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'HTML2PNG Administration',
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  // Initialize admin from env on first load
  await initializeAdmin()

  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  if (!user.isAdmin && !isUserAdmin(user.id)) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)

  const settings = {
    registrationEnabled: isRegistrationEnabled(),
  }

  const users = getAllUsers()

  return <AdminClient dict={dict} initialSettings={settings} initialUsers={users} />
}
