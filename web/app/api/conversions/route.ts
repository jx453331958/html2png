import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { listConversions, getConversionCount } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const conversions = listConversions(user.id, limit, offset)
  const total = getConversionCount(user.id)

  return NextResponse.json({
    conversions,
    total,
    limit,
    offset,
  })
}
