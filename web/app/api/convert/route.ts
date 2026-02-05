import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { convertHtmlToPng } from '@/lib/converter'

export async function POST(request: NextRequest) {
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

    const png = await convertHtmlToPng({
      html,
      width: width ? Math.min(Math.max(width, 100), 4096) : 1200,
      height: height ? Math.min(Math.max(height, 100), 10000) : undefined,
      dpr: [1, 2, 3].includes(dpr) ? dpr : 1,
      fullPage: Boolean(fullPage),
    })

    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="screenshot.png"',
      },
    })
  } catch (error) {
    console.error('Convert error:', error)
    return NextResponse.json({ error: 'Conversion failed' }, { status: 500 })
  }
}
