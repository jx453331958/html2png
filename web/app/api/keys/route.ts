import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createApiKey, listApiKeys } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = listApiKeys(user.id)
  return NextResponse.json({ keys })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { name } = body as { name?: string }

    const key = createApiKey(user.id, name)

    return NextResponse.json({
      message: 'API key created. Save this key - it will not be shown again.',
      key: {
        id: key.id,
        key: key.key,
        keyPrefix: key.keyPrefix,
        name: name || null,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create key error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
