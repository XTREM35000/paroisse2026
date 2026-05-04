export interface EncryptedKey {
  /** base64 */
  ciphertext: string;
  /** base64 */
  iv: string;
}

function requireBrowserCrypto(): Crypto {
  if (typeof window === 'undefined') throw new Error('WebCrypto unavailable (no window).');
  if (!window.crypto?.subtle) throw new Error('WebCrypto unavailable (crypto.subtle missing).');
  return window.crypto;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/**
 * Client-side encryption for RTMP keys.
 *
 * IMPORTANT: Keeping the master key in the browser is NOT “perfect security”.
 * This is a pragmatic step to avoid plaintext storage. For production-grade
 * security, move encryption/decryption to:
 * - an Edge Function (server-side) using Supabase secrets, or
 * - Postgres using pgcrypto + secrets and only returning masked values to clients.
 */
export class RtmpKeyEncryption {
  static async encrypt(plainKey: string): Promise<EncryptedKey> {
    const crypto = requireBrowserCrypto();

    const master = String(import.meta.env.VITE_RTMP_MASTER_KEY || '').trim();
    if (!master) {
      throw new Error('VITE_RTMP_MASTER_KEY manquant (base64, 32 bytes).');
    }

    // Expect 32 bytes base64 for AES-256
    const keyBytes = base64ToBytes(master);
    if (keyBytes.length !== 32) {
      throw new Error('VITE_RTMP_MASTER_KEY invalide: attendu 32 bytes en base64.');
    }

    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    const ivBytes = crypto.getRandomValues(new Uint8Array(12)); // recommended for GCM
    const plaintextBytes = new TextEncoder().encode(plainKey);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBytes }, key, plaintextBytes);

    return {
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      iv: bytesToBase64(ivBytes),
    };
  }

  static async decrypt(ciphertextB64: string, ivB64: string): Promise<string> {
    const crypto = requireBrowserCrypto();

    const master = String(import.meta.env.VITE_RTMP_MASTER_KEY || '').trim();
    if (!master) {
      throw new Error('VITE_RTMP_MASTER_KEY manquant (base64, 32 bytes).');
    }

    const keyBytes = base64ToBytes(master);
    if (keyBytes.length !== 32) {
      throw new Error('VITE_RTMP_MASTER_KEY invalide: attendu 32 bytes en base64.');
    }

    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const ivBytes = base64ToBytes(ivB64);
    const ciphertextBytes = base64ToBytes(ciphertextB64);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, ciphertextBytes);
    return new TextDecoder().decode(plaintext);
  }
}

