import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser } from '@/lib/auth'
import { isRegistrationEnabled } from '@/lib/db'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create an account on HTML2PNG to start converting HTML to PNG images',
}

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/')
  }

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)
  const registrationEnabled = isRegistrationEnabled()

  return <RegisterClient dict={dict} registrationEnabled={registrationEnabled} />
}
