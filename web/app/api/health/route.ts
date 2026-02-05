import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if we can import playwright
    const { chromium } = await import('playwright')

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      playwright: 'available',
      node: process.version,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      node: process.version,
    }, { status: 500 })
  }
}
