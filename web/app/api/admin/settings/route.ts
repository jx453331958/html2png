import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { setSetting, isRegistrationEnabled, isInvitationRequired } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      registrationEnabled: isRegistrationEnabled(),
      invitationRequired: isInvitationRequired(),
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { registrationEnabled, invitationRequired } = await request.json()

    if (typeof registrationEnabled === 'boolean') {
      setSetting('registration_enabled', registrationEnabled ? 'true' : 'false')
    }

    if (typeof invitationRequired === 'boolean') {
      setSetting('invitation_required', invitationRequired ? 'true' : 'false')
    }

    return NextResponse.json({
      registrationEnabled: isRegistrationEnabled(),
      invitationRequired: isInvitationRequired(),
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
