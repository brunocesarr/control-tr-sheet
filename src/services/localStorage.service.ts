'use client';

import { AES, enc } from 'crypto-js';

import { clientEnv } from '@/configs/env.client';

/**
 * TTL-aware localStorage wrapper.
 *
 * ⚠️ SECURITY NOTE
 * The previous version called `AES.decrypt(item, 'sw')` — a hardcoded
 * two-character key. Client-side encryption is fundamentally obfuscation:
 * whatever key we use ships inside the JS bundle and is readable by anyone
 * with devtools. The key now comes from an env var purely so it differs per
 * deployment, and the API is named to make the guarantee explicit.
 *
 * RULE: never put credentials, tokens or personal data here. The session
 * token lives in an httpOnly cookie precisely because JS must not read it.
 */

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface StoredEnvelope<T> {
  value: T;
  expiresAt: number | null;
}

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

function obfuscate<T>(envelope: StoredEnvelope<T>): string {
  return AES.encrypt(JSON.stringify(envelope), clientEnv.storageObfuscationKey).toString();
}

function deobfuscate<T>(raw: string): StoredEnvelope<T> | null {
  try {
    const plaintext = AES.decrypt(raw, clientEnv.storageObfuscationKey).toString(enc.Utf8);
    if (!plaintext) return null;
    return JSON.parse(plaintext) as StoredEnvelope<T>;
  } catch {
    return null;
  }
}

function getItem<T>(key: string): T | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  const envelope = deobfuscate<T>(raw);
  if (!envelope) {
    // Key rotated or data corrupted — drop it rather than throw.
    window.localStorage.removeItem(key);
    return null;
  }

  if (envelope.expiresAt !== null && Date.now() > envelope.expiresAt) {
    window.localStorage.removeItem(key);
    return null;
  }

  return envelope.value;
}

function setItem<T>(key: string, value: T, ttlMs: number | null = DEFAULT_TTL_MS): void {
  if (!isBrowser()) return;

  const envelope: StoredEnvelope<T> = {
    value,
    expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
  };

  try {
    window.localStorage.setItem(key, obfuscate(envelope));
  } catch (error) {
    // QuotaExceededError / Safari private mode — caching is best-effort.
    console.warn(`[localStorage] Could not persist "${key}".`, error);
  }
}

function deleteItem(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

function clearNamespace(prefix: string): void {
  if (!isBrowser()) return;
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => window.localStorage.removeItem(key));
}

const localStorageService = { getItem, setItem, deleteItem, clearNamespace };

export default localStorageService;
