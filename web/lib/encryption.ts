import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

// Get encryption key from environment variable
function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    return null
  }

  // Key should be 32 bytes (256 bits) for AES-256
  // If provided as hex string, convert it
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  // If provided as base64
  if (key.length === 44) {
    return Buffer.from(key, 'base64')
  }

  // Use SHA-256 hash of the key to ensure correct length
  return crypto.createHash('sha256').update(key).digest()
}

export function isEncryptionEnabled(): boolean {
  return !!process.env.ENCRYPTION_KEY
}

export function encrypt(text: string): string {
  const key = getEncryptionKey()
  if (!key) {
    // Encryption not enabled, return plain text with marker
    return `plain:${text}`
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  // Return format: enc:<iv>:<tag>:<encrypted>
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  // Check if it's plain text (not encrypted)
  if (encryptedText.startsWith('plain:')) {
    return encryptedText.substring(6)
  }

  // Check if it's encrypted
  if (!encryptedText.startsWith('enc:')) {
    // Legacy data without encryption marker, return as-is
    return encryptedText
  }

  const key = getEncryptionKey()
  if (!key) {
    // Can't decrypt without key
    console.warn('Cannot decrypt: ENCRYPTION_KEY not set')
    return '[Encrypted content - key not available]'
  }

  try {
    const parts = encryptedText.substring(4).split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const [ivHex, tagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption failed:', error)
    return '[Decryption failed]'
  }
}
