/**
 * End-to-end encryption for chat (server side: convex/messages.ts).
 *
 * - Each browser has an ECDH P-256 key pair per player. The private key is
 *   made non-extractable and kept in IndexedDB: no script can read it out,
 *   and it never leaves this browser.
 * - A conversation key is 32 random bytes used with AES-256-GCM. It is sent
 *   to each member device "wrapped": ECDH(one-off key, device key) → HKDF-SHA256
 *   → AES-GCM. The server only ever sees wrapped keys and ciphertext.
 * - Message AAD binds a ciphertext to its conversation, key version and
 *   sender, so the server can't move a message to another chat or sender.
 *
 * Only Web Crypto is used, so a phone app can do the same with any library
 * that has P-256, HKDF and AES-GCM.
 */

const DB_NAME = 'unlocked-chat';
const STORE = 'devices';
const enc = new TextEncoder();
const dec = new TextDecoder();

export interface DeviceIdentity {
  deviceId: string;
  privateKey: CryptoKey;
  publicJwk: string;
}

export interface WrappedKey {
  ephemeralPublicKey: string;
  iv: string;
  wrappedKey: string;
}

export interface ConversationKey {
  raw: Uint8Array; // kept in memory to share with new devices
  key: CryptoKey;
}

// ─── base64 ───

export function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomId(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(18))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function chatSupported(): boolean {
  return typeof window !== 'undefined' && !!window.crypto?.subtle && typeof indexedDB !== 'undefined';
}

// ─── IndexedDB ───

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Device identity ───

const identities = new Map<string, Promise<DeviceIdentity>>();

/** This browser's chat key for a player (made the first time). */
export function getDeviceIdentity(userId: string): Promise<DeviceIdentity> {
  let p = identities.get(userId);
  if (!p) {
    p = (async () => {
      const saved = await idbGet<DeviceIdentity>(`user:${userId}`);
      if (saved?.privateKey && saved.publicJwk && saved.deviceId) return saved;
      const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
      const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
      const identity: DeviceIdentity = {
        deviceId: randomId(),
        privateKey: pair.privateKey,
        publicJwk: JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }),
      };
      await idbPut(`user:${userId}`, identity);
      return identity;
    })();
    identities.set(userId, p);
    p.catch(() => identities.delete(userId));
  }
  return p;
}

function importPublic(jwk: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', JSON.parse(jwk), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

async function kek(privateKey: CryptoKey, publicJwk: string, info: string): Promise<CryptoKey> {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: await importPublic(publicJwk) }, privateKey, 256);
  const hkdf = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(info) },
    hkdf,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

const wrapInfo = (conversationId: string, keyVersion: number, userId: string, deviceId: string) =>
  `unlocked-chat/wrap/v1|${conversationId}|${keyVersion}|${userId}|${deviceId}`;

// ─── Conversation keys ───

export function newConversationKey(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function importConversationKey(raw: Uint8Array<ArrayBuffer>): Promise<ConversationKey> {
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return { raw, key };
}

/** Encrypts a conversation key for one device. */
export async function wrapFor(
  raw: Uint8Array<ArrayBuffer>,
  recipientPublicJwk: string,
  ctx: { conversationId: string; keyVersion: number; userId: string; deviceId: string }
): Promise<WrappedKey> {
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const jwk = await crypto.subtle.exportKey('jwk', eph.publicKey);
  const k = await kek(eph.privateKey, recipientPublicJwk, wrapInfo(ctx.conversationId, ctx.keyVersion, ctx.userId, ctx.deviceId));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, raw));
  return {
    ephemeralPublicKey: JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }),
    iv: toB64(iv),
    wrappedKey: toB64(ct),
  };
}

/** Decrypts a conversation key wrapped for this device. */
export async function unwrap(
  identity: DeviceIdentity,
  w: WrappedKey,
  ctx: { conversationId: string; keyVersion: number; userId: string }
): Promise<ConversationKey> {
  const k = await kek(identity.privateKey, w.ephemeralPublicKey, wrapInfo(ctx.conversationId, ctx.keyVersion, ctx.userId, identity.deviceId));
  const raw = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(w.iv) }, k, fromB64(w.wrappedKey)));
  if (raw.length !== 32) throw new Error('bad key');
  return importConversationKey(raw);
}

// ─── Messages ───

export interface Plain {
  text: string;
}

const aad = (conversationId: string, keyVersion: number, senderId: string) =>
  enc.encode(`unlocked-chat/msg/v1|${conversationId}|${keyVersion}|${senderId}`);

export async function encryptMessage(
  key: ConversationKey,
  msg: Plain,
  ctx: { conversationId: string; keyVersion: number; senderId: string }
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = enc.encode(JSON.stringify({ v: 1, text: msg.text }));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(ctx.conversationId, ctx.keyVersion, ctx.senderId) }, key.key, body)
  );
  return { iv: toB64(iv), ciphertext: toB64(ct) };
}

export async function decryptMessage(
  key: ConversationKey,
  m: { iv: string; ciphertext: string },
  ctx: { conversationId: string; keyVersion: number; senderId: string }
): Promise<Plain> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(m.iv), additionalData: aad(ctx.conversationId, ctx.keyVersion, ctx.senderId) },
    key.key,
    fromB64(m.ciphertext)
  );
  const parsed = JSON.parse(dec.decode(pt));
  return { text: typeof parsed?.text === 'string' ? parsed.text : '' };
}

// ─── Security code ───

/**
 * A 30-digit code from a player's device keys. Two players who see the same
 * code for each other know nobody slipped an extra device in between.
 */
export async function securityCode(publicKeys: string[]): Promise<string> {
  const material = [...publicKeys]
    .map((k) => {
      const j = JSON.parse(k);
      return `${j.x}.${j.y}`;
    })
    .sort()
    .join('|');
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`unlocked-chat/code/v1|${material}`)));
  const groups: string[] = [];
  for (let i = 0; i < 6; i++) {
    const n = ((hash[i * 4] << 24) | (hash[i * 4 + 1] << 16) | (hash[i * 4 + 2] << 8) | hash[i * 4 + 3]) >>> 0;
    groups.push(String(n % 100000).padStart(5, '0'));
  }
  return groups.join(' ');
}
