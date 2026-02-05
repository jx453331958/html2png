import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revokeToken } from '@/lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  // Revoke the token before deleting the cookie
  if (token) {
    await revokeToken(token)
  }

  cookieStore.delete('token')
  return NextResponse.json({ success: true })
}
