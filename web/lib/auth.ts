import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getDb, User } from './db'
import argon2 from 'argon2'
import crypto from 'crypto'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-dev-secret-change-me-in-production'
)
const KEY_PREFIX = 'h2p_'

export interface JWTPayload {
  id: number
  email: string
  isAdmin: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password)
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

// Initialize admin account from environment variables
export async function initializeAdmin(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    return
  }

  const db = getDb()
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as { id: number } | undefined

  if (existingAdmin) {
    // Ensure existing user is marked as admin
    db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(adminEmail)
    return
  }

  // Create new admin account
  const passwordHash = await hashPassword(adminPassword)
  db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)').run(adminEmail, passwordHash)
  console.log(`Admin account created: ${adminEmail}`)
}

export async function createUser(email: string, password: string, isAdmin = false): Promise<User> {
  const db = getDb()
  const passwordHash = await hashPassword(password)

  const stmt = db.prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)')
  const result = stmt.run(email, passwordHash, isAdmin ? 1 : 0)

  return {
    id: result.lastInsertRowid as number,
    email,
    password_hash: passwordHash,
    is_admin: isAdmin ? 1 : 0,
    created_at: new Date().toISOString(),
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  const user = stmt.get(email) as User | undefined

  if (!user) return null

  const valid = await verifyPassword(user.password_hash, password)
  if (!valid) return null

  return user
}

export function getUserById(id: number): User | null {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id) as User | null
}

export function isUserAdmin(userId: number): boolean {
  const user = getUserById(userId)
  return user?.is_admin === 1
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = getUserById(userId)
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  const valid = await verifyPassword(user.password_hash, currentPassword)
  if (!valid) {
    return { success: false, error: 'Current password is incorrect' }
  }

  const db = getDb()
  const newPasswordHash = await hashPassword(newPassword)
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
  stmt.run(newPasswordHash, userId)

  return { success: true }
}

// API Key functions
function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return KEY_PREFIX + randomBytes
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export function createApiKey(userId: number, name?: string): { id: number; key: string; keyPrefix: string } {
  const db = getDb()
  const key = generateApiKey()
  const keyHash = hashApiKey(key)
  const keyPrefix = key.substring(0, 8) + '...'

  const stmt = db.prepare(`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(userId, keyHash, keyPrefix, name || null)

  return {
    id: result.lastInsertRowid as number,
    key,
    keyPrefix,
  }
}

interface ApiKeyInfo {
  id: number
  key_prefix: string
  name: string | null
  created_at: string
  last_used_at: string | null
  is_active: number
}

export function listApiKeys(userId: number): ApiKeyInfo[] {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT id, key_prefix, name, created_at, last_used_at, is_active
    FROM api_keys
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `)
  return stmt.all(userId) as ApiKeyInfo[]
}

export function deleteApiKey(userId: number, keyId: number): boolean {
  const db = getDb()
  const stmt = db.prepare(`
    UPDATE api_keys SET is_active = 0
    WHERE id = ? AND user_id = ?
  `)
  const result = stmt.run(keyId, userId)
  return result.changes > 0
}

export async function verifyApiKey(key: string): Promise<JWTPayload | null> {
  if (!key || !key.startsWith(KEY_PREFIX)) return null

  const db = getDb()
  const keyHash = hashApiKey(key)

  const stmt = db.prepare(`
    SELECT ak.id, ak.user_id, u.email, u.is_admin
    FROM api_keys ak
    JOIN users u ON ak.user_id = u.id
    WHERE ak.key_hash = ? AND ak.is_active = 1
  `)
  const result = stmt.get(keyHash) as { id: number; user_id: number; email: string; is_admin: number } | undefined

  if (!result) return null

  // Update last_used_at
  const updateStmt = db.prepare('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?')
  updateStmt.run(result.id)

  return { id: result.user_id, email: result.email, isAdmin: result.is_admin === 1 }
}

export async function getAuthUser(request: Request): Promise<JWTPayload | null> {
  // Check API key first
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    return verifyApiKey(apiKey)
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyToken(token)
  }

  // Check cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (token) {
    return verifyToken(token)
  }

  return null
}
