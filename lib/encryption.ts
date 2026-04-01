import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32  // 256 bits
const IV_BYTES = 16   // 128 bits

function getKey(): Buffer {
  const keyHex = process.env.PERSONNUMMER_ENCRYPTION_KEY
  if (!keyHex) throw new Error('PERSONNUMMER_ENCRYPTION_KEY is not set')
  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== KEY_BYTES) {
    throw new Error('PERSONNUMMER_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  }
  return key
}

/**
 * Encrypt a personnummer with AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 * Safe to store in the database.
 */
export function encryptPersonnummer(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt a personnummer encrypted with encryptPersonnummer().
 * Throws if the key is wrong or the ciphertext has been tampered with.
 */
export function decryptPersonnummer(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted personnummer format')
  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * Returns true if the string looks like a value produced by encryptPersonnummer().
 * Used to distinguish already-encrypted values from plaintext.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p))
}

/**
 * Normalise a Swedish personnummer to the 12-digit format (YYYYMMDDXXXX).
 * Accepts YYYYMMDD-XXXX, YYYYMMDDXXXX, YYMMDD-XXXX, YYMMDDXXXX.
 */
export function normalisePersonnummer(raw: string): string {
  const digits = raw.replace(/[-\s]/g, '')
  if (digits.length === 12) return digits
  if (digits.length === 10) {
    const year = parseInt(digits.slice(0, 2), 10)
    const century = year <= new Date().getFullYear() % 100 ? '20' : '19'
    return `${century}${digits}`
  }
  throw new Error('Invalid personnummer format')
}
