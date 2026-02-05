import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, deleteApiKey } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const keyId = parseInt(id, 10)
  if (isNaN(keyId)) {
    return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 })
  }

  const deleted = deleteApiKey(user.id, keyId)
  if (!deleted) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
