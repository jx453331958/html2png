import Database from 'better-sqlite3'
import path from 'path'

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
  `)

  // Add is_admin column if it doesn't exist (for existing databases)
  try {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0')
  } catch {
    // Column already exists
  }

  // Initialize default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
  `)
  insertSetting.run('registration_enabled', 'false')
}

export interface User {
  id: number
  email: string
  password_hash: string
  is_admin: number
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

// Get all users (for admin)
export function getAllUsers(): Omit<User, 'password_hash'>[] {
  const db = getDb()
  const stmt = db.prepare('SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC')
  return stmt.all() as Omit<User, 'password_hash'>[]
}

// Delete user (for admin)
export function deleteUser(userId: number): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0')
  const result = stmt.run(userId)
  return result.changes > 0
}
