import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isUserAdmin } from '@/lib/auth'
import { deleteInvitationCode, toggleInvitationCode } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user || !isUserAdmin(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const codeId = parseInt(id)
  if (isNaN(codeId)) {
    return NextResponse.json({ error: 'Invalid code ID' }, { status: 400 })
  }

  const deleted = deleteInvitationCode(codeId)
  if (!deleted) {
    return NextResponse.json({ error: 'Invitation code not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user || !isUserAdmin(user.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const codeId = parseInt(id)
  if (isNaN(codeId)) {
    return NextResponse.json({ error: 'Invalid code ID' }, { status: 400 })
  }

  const toggled = toggleInvitationCode(codeId)
  if (!toggled) {
    return NextResponse.json({ error: 'Invitation code not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
