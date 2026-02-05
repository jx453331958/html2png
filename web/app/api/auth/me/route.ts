import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fullUser = getUserById(user.id)
  if (!fullUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: fullUser.id,
    email: fullUser.email,
    createdAt: fullUser.created_at,
  })
}
