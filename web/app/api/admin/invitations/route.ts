import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isUserAdmin } from '@/lib/auth'
import { listInvitationCodes, createInvitationCode } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || !isUserAdmin(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codes = listInvitationCodes()
  return NextResponse.json({ codes })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || !isUserAdmin(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, maxUses, expiresAt } = body

    const code = createInvitationCode(
      name,
      maxUses || 1,
      expiresAt ? new Date(expiresAt) : undefined
    )

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Create invitation code error:', error)
    return NextResponse.json({ error: 'Failed to create invitation code' }, { status: 500 })
  }
}
