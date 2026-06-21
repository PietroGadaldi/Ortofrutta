import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const keyHex = process.env.PASSWORD_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('PASSWORD_ENCRYPTION_KEY non configurata o invalida (deve essere 64 caratteri hex)')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Cifra un testo con AES-256-GCM.
 * Formato output: "iv_hex:authTag_hex:encrypted_hex"
 */
export function encrypt(text) {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decifra un valore cifrato con encrypt().
 * Ritorna null se il valore è null/undefined o se la decifratura fallisce.
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null
  try {
    const key = getKey()
    const parts = encryptedText.split(':')
    if (parts.length !== 3) return null
    const [ivHex, authTagHex, encryptedHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
