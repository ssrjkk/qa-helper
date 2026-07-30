/**
 * AES-GCM encryption/decryption for API keys
 * @module encryption
 * @author ssrjkk
 */

import { keyManager } from './keyManagement';
import { arrayBufferToBase64, base64ToArrayBuffer } from './base64';
import { ErrorService } from './errorService';
import { ErrorCode, STORAGE_KEYS } from './constants';

const PBKDF2_ITERATIONS = 100000;
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const LEGACY_KEY_LENGTH = 32;

function lsGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function lsRemoveItem(key: string): void {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}

async function getOrCreateSalt(): Promise<Uint8Array> {
  const storedSalt = lsGetItem(STORAGE_KEYS.salt);
  if (storedSalt) {
    return base64ToArrayBuffer(storedSalt);
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  lsSetItem(STORAGE_KEYS.salt, arrayBufferToBase64(salt.buffer));
  return salt;
}

async function getOrCreateLegacyKey(): Promise<string> {
  const stored = lsGetItem(STORAGE_KEYS.legacyKey);
  if (stored) return stored;
  const randomBytes = crypto.getRandomValues(new Uint8Array(LEGACY_KEY_LENGTH));
  const key = arrayBufferToBase64(randomBytes.buffer);
  lsSetItem(STORAGE_KEYS.legacyKey, key);
  return key;
}

async function legacyDeriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphrase = await getOrCreateLegacyKey();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

async function legacyEncrypt(apiKey: string): Promise<string> {
  const salt = await getOrCreateSalt();
  const key = await legacyDeriveKey(salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    key,
    encoder.encode(apiKey)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

async function legacyDecrypt(encryptedData: string): Promise<string | null> {
  try {
    const combined = base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);
    const salt = await getOrCreateSalt();
    const key = await legacyDeriveKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: iv },
      key,
      new Uint8Array(data)
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    ErrorService.reportAsync(ErrorCode.DECRYPT, err);
    return null;
  }
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  if (keyManager.isReady()) {
    return keyManager.encryptApiKey(apiKey);
  }
  return legacyEncrypt(apiKey);
}

export async function decryptApiKey(encryptedData: string): Promise<string | null> {
  if (keyManager.isReady()) {
    try {
      return await keyManager.decryptApiKey(encryptedData);
    } catch {
      return legacyDecrypt(encryptedData);
    }
  }
  return legacyDecrypt(encryptedData);
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const encrypted = await encryptApiKey(apiKey);
  lsSetItem(STORAGE_KEYS.apiKey, encrypted);
}

export async function loadApiKey(): Promise<string | null> {
  const encrypted = lsGetItem(STORAGE_KEYS.apiKey);
  if (!encrypted) return null;
  return decryptApiKey(encrypted);
}

export function clearApiKey(): void {
  lsRemoveItem(STORAGE_KEYS.apiKey);
  lsRemoveItem(STORAGE_KEYS.salt);
  lsRemoveItem(STORAGE_KEYS.legacyKey);
}
