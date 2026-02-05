import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  auth: { windowMs: 60000, max: 10 },      // 10 requests per minute for auth
  convert: { windowMs: 60000, max: 30 },   // 30 requests per minute for convert
  api: { windowMs: 60000, max: 100 },      // 100 requests per minute for general API
} as const

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = rateLimitConfigs.api
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.max - entry.count)

  return {
    success: entry.count <= config.max,
    remaining,
    resetAt: entry.resetAt,
  }
}

export function getClientIp(request: Request): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default identifier
  return 'unknown'
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests, please try again later' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
      },
    }
  )
}

// Helper function to apply rate limiting to a request
export function withRateLimit(
  request: Request,
  config: RateLimitConfig = rateLimitConfigs.api
): { success: true } | { success: false; response: NextResponse } {
  const ip = getClientIp(request)
  const result = checkRateLimit(ip, config)

  if (!result.success) {
    return { success: false, response: rateLimitResponse(result) }
  }

  return { success: true }
}
