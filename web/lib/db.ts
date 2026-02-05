import Database from 'better-sqlite3'
import path from 'path'
import { encrypt, decrypt } from './encryption'

const dbPath = path.join(process.cwd(), 'data', 'html2png.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

    CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      html_preview TEXT,
      width INTEGER,
      height INTEGER,
      dpr INTEGER DEFAULT 1,
      full_page INTEGER DEFAULT 0,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);

    CREATE TABLE IF NOT EXISTS invitation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT,
      max_uses INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);

    CREATE TABLE IF NOT EXISTS token_blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
    CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
  `)

  // Add is_admin column if it doesn't exist (for existing databases)
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0')
  } catch {
    // Column already exists
  }

  // Add invited_by_code column if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN invited_by_code TEXT')
  } catch {
    // Column already exists
  }

  // Add html_content column if it doesn't exist (for storing full HTML)
  try {
    db.exec('ALTER TABLE conversions ADD COLUMN html_content TEXT')
  } catch {
    // Column already exists
  }

  // Initialize default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
  `)
  insertSetting.run('registration_enabled', 'false')
  insertSetting.run('invitation_required', 'false')
}

export interface User {
  id: number
  email: string
  password_hash: string
  is_admin: number
  invited_by_code: string | null
  created_at: string
}

export interface ApiKey {
  id: number
  user_id: number
  key_hash: string
  key_prefix: string
  name: string | null
  created_at: string
  last_used_at: string | null
  is_active: number
}

export interface SystemSetting {
  key: string
  value: string
  updated_at: string
}

export interface Conversion {
  id: number
  user_id: number
  html_preview: string | null
  html_content: string | null
  width: number
  height: number | null
  dpr: number
  full_page: number
  file_size: number | null
  created_at: string
}

export interface InvitationCode {
  id: number
  code: string
  name: string | null
  max_uses: number
  used_count: number
  is_active: number
  created_at: string
  expires_at: string | null
}

// System settings functions
export function getSetting(key: string): string | null {
  const db = getDb()
  const stmt = db.prepare('SELECT value FROM system_settings WHERE key = ?')
  const result = stmt.get(key) as { value: string } | undefined
  return result?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `)
  stmt.run(key, value, value)
}

export function isRegistrationEnabled(): boolean {
  return getSetting('registration_enabled') === 'true'
}

export function setRegistrationEnabled(enabled: boolean): void {
  setSetting('registration_enabled', enabled ? 'true' : 'false')
}

export interface UserWithInvitation {
  id: number
  email: string
  is_admin: number
  invited_by_code: string | null
  created_at: string
}

// Get all users (for admin)
export function getAllUsers(): UserWithInvitation[] {
  const db = getDb()
  const stmt = db.prepare('SELECT id, email, is_admin, invited_by_code, created_at FROM users ORDER BY created_at DESC')
  return stmt.all() as UserWithInvitation[]
}

// Delete user (for admin)
export function deleteUser(userId: number): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0')
  const result = stmt.run(userId)
  return result.changes > 0
}

// Conversion history functions
export function saveConversion(
  userId: number,
  html: string,
  width: number,
  height: number | null,
  dpr: number,
  fullPage: boolean,
  fileSize: number
): number {
  const db = getDb()
  // Store first 500 characters of HTML as preview (not encrypted for display)
  // Encrypt full HTML for secure storage
  const htmlPreview = html.length > 500 ? html.substring(0, 500) + '...' : html
  const encryptedHtml = encrypt(html)
  const stmt = db.prepare(`
    INSERT INTO conversions (user_id, html_preview, html_content, width, height, dpr, full_page, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(userId, htmlPreview, encryptedHtml, width, height, dpr, fullPage ? 1 : 0, fileSize)
  return result.lastInsertRowid as number
}

export interface ConversionInfo {
  id: number
  html_preview: string | null
  html_content: string | null
  width: number
  height: number | null
  dpr: number
  full_page: number
  file_size: number | null
  created_at: string
}

export function listConversions(userId: number, limit = 50, offset = 0): ConversionInfo[] {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT id, html_preview, html_content, width, height, dpr, full_page, file_size, created_at
    FROM conversions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)
  const results = stmt.all(userId, limit, offset) as ConversionInfo[]

  // Decrypt html_content for each result
  return results.map(r => ({
    ...r,
    html_content: r.html_content ? decrypt(r.html_content) : null,
  }))
}

export function getConversionCount(userId: number): number {
  const db = getDb()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM conversions WHERE user_id = ?')
  const result = stmt.get(userId) as { count: number }
  return result.count
}

export function deleteConversion(userId: number, conversionId: number): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM conversions WHERE id = ? AND user_id = ?')
  const result = stmt.run(conversionId, userId)
  return result.changes > 0
}

// Invitation code functions
export function isInvitationRequired(): boolean {
  return getSetting('invitation_required') === 'true'
}

export function setInvitationRequired(required: boolean): void {
  setSetting('invitation_required', required ? 'true' : 'false')
}

function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function createInvitationCode(name?: string, maxUses = 1, expiresAt?: Date): InvitationCode {
  const db = getDb()
  let code: string
  let attempts = 0

  // Generate unique code
  while (true) {
    code = generateInvitationCode()
    const existing = db.prepare('SELECT id FROM invitation_codes WHERE code = ?').get(code)
    if (!existing) break
    attempts++
    if (attempts > 10) throw new Error('Failed to generate unique code')
  }

  const stmt = db.prepare(`
    INSERT INTO invitation_codes (code, name, max_uses, expires_at)
    VALUES (?, ?, ?, ?)
  `)
  const result = stmt.run(code, name || null, maxUses, expiresAt?.toISOString() || null)

  return {
    id: result.lastInsertRowid as number,
    code,
    name: name || null,
    max_uses: maxUses,
    used_count: 0,
    is_active: 1,
    created_at: new Date().toISOString(),
    expires_at: expiresAt?.toISOString() || null,
  }
}

export function listInvitationCodes(): InvitationCode[] {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT id, code, name, max_uses, used_count, is_active, created_at, expires_at
    FROM invitation_codes
    ORDER BY created_at DESC
  `)
  return stmt.all() as InvitationCode[]
}

export function deleteInvitationCode(codeId: number): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM invitation_codes WHERE id = ?')
  const result = stmt.run(codeId)
  return result.changes > 0
}

export function toggleInvitationCode(codeId: number): boolean {
  const db = getDb()
  const stmt = db.prepare('UPDATE invitation_codes SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?')
  const result = stmt.run(codeId)
  return result.changes > 0
}

export function validateInvitationCode(code: string): { valid: boolean; error?: string } {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM invitation_codes WHERE code = ?')
  const invitation = stmt.get(code) as InvitationCode | undefined

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation code' }
  }

  if (invitation.is_active !== 1) {
    return { valid: false, error: 'Invitation code is disabled' }
  }

  if (invitation.max_uses > 0 && invitation.used_count >= invitation.max_uses) {
    return { valid: false, error: 'Invitation code has reached maximum uses' }
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: 'Invitation code has expired' }
  }

  return { valid: true }
}

export function useInvitationCode(code: string): boolean {
  const db = getDb()
  const stmt = db.prepare('UPDATE invitation_codes SET used_count = used_count + 1 WHERE code = ?')
  const result = stmt.run(code)
  return result.changes > 0
}

// Token blacklist functions
export function addTokenToBlacklist(tokenHash: string, expiresAt: Date): void {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO token_blacklist (token_hash, expires_at)
    VALUES (?, ?)
  `)
  stmt.run(tokenHash, expiresAt.toISOString())
}

export function isTokenBlacklisted(tokenHash: string): boolean {
  const db = getDb()
  const stmt = db.prepare('SELECT id FROM token_blacklist WHERE token_hash = ?')
  const result = stmt.get(tokenHash)
  return !!result
}

export function cleanupExpiredTokens(): number {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP')
  const result = stmt.run()
  return result.changes
}

