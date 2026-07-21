import { keyManager } from './keyManagement';
import { arrayBufferToBase64, base64ToArrayBuffer } from './base64';

const STORAGE_KEY_SALT = 'qa-helper-salt';
const STORAGE_KEY_API_KEY = 'qa-api-key';
const PBKDF2_ITERATIONS = 100000;
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const LEGACY_KEY_STORAGE = 'qa-helper-legacy-key';
const LEGACY_KEY_LENGTH = 32;

async function getOrCreateSalt(): Promise<Uint8Array> {
  const storedSalt = localStorage.getItem(STORAGE_KEY_SALT);
  if (storedSalt) {
    return base64ToArrayBuffer(storedSalt);
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  localStorage.setItem(STORAGE_KEY_SALT, arrayBufferToBase64(salt.buffer));
  return salt;
}

async function getOrCreateLegacyKey(): Promise<string> {
  const stored = localStorage.getItem(LEGACY_KEY_STORAGE);
  if (stored) return stored;
  const randomBytes = crypto.getRandomValues(new Uint8Array(LEGACY_KEY_LENGTH));
  const key = arrayBufferToBase64(randomBytes.buffer);
  localStorage.setItem(LEGACY_KEY_STORAGE, key);
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
  } catch {
    if (import.meta.env.DEV) console.warn('[encryption] Legacy decryption failed');
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
  localStorage.setItem(STORAGE_KEY_API_KEY, encrypted);
}

export async function loadApiKey(): Promise<string | null> {
  const encrypted = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (!encrypted) return null;
  return decryptApiKey(encrypted);
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY_API_KEY);
  localStorage.removeItem(STORAGE_KEY_SALT);
}
