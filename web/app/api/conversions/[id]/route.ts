import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { deleteConversion } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const conversionId = parseInt(id)
  if (isNaN(conversionId)) {
    return NextResponse.json({ error: 'Invalid conversion ID' }, { status: 400 })
  }

  const deleted = deleteConversion(user.id, conversionId)
  if (!deleted) {
    return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
