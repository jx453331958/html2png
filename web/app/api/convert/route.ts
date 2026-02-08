import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { convertHtmlToPng } from '@/lib/converter'
import { saveConversion } from '@/lib/db'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimit = withRateLimit(request, rateLimitConfigs.convert)
  if (!rateLimit.success) {
    return rateLimit.response
  }

  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { html, width, height, dpr, fullPage } = body

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    const actualWidth = width ? Math.min(Math.max(width, 100), 4096) : 1200
    const actualHeight = height ? Math.min(Math.max(height, 100), 10000) : undefined
    const actualDpr = [1, 2, 3].includes(dpr) ? dpr : 1
    const actualFullPage = Boolean(fullPage)

    const png = await convertHtmlToPng({
      html,
      width: actualWidth,
      height: actualHeight,
      dpr: actualDpr,
      fullPage: actualFullPage,
    })

    // Save conversion to history
    try {
      saveConversion(user.id, html, actualWidth, actualHeight ?? null, actualDpr, actualFullPage, png.length)
    } catch (e) {
      console.error('Failed to save conversion history:', e)
    }

    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="screenshot-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png"`,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Convert error:', errorMessage)
    console.error('Stack:', errorStack)
    return NextResponse.json({
      error: 'Conversion failed',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
