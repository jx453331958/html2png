import { NextRequest, NextResponse } from 'next/server'
import { createUser, createToken } from '@/lib/auth'
import {
  isRegistrationEnabled,
  isInvitationRequired,
  validateInvitationCode,
  useInvitationCode
} from '@/lib/db'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimit = withRateLimit(request, rateLimitConfigs.auth)
  if (!rateLimit.success) {
    return rateLimit.response
  }

  try {
    // Check if registration is enabled
    if (!isRegistrationEnabled()) {
      return NextResponse.json({ error: 'Registration is currently disabled' }, { status: 403 })
    }

    const { email, password, invitationCode } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check if invitation code is required
    if (isInvitationRequired()) {
      if (!invitationCode) {
        return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
      }

      const validation = validateInvitationCode(invitationCode)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Create user with invitation code if provided
    const user = await createUser(email, password, false, invitationCode || undefined)

    // Use the invitation code (increment used_count)
    if (invitationCode) {
      useInvitationCode(invitationCode)
    }

    const token = await createToken({ id: user.id, email: user.email, isAdmin: false })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      token,
    })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
