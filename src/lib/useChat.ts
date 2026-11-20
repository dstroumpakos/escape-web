'use client';

/**
 * Chat hooks: this browser's device key, and the keys of one conversation
 * (unwrap, make a new one when members changed, share with new devices).
 * See src/lib/chatCrypto.ts for the crypto and convex/messages.ts for the server.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAuth } from './auth';
import {
  chatSupported,
  decryptMessage,
  encryptMessage,
  getDeviceIdentity,
  importConversationKey,
  newConversationKey,
  unwrap,
  wrapFor,
  type ConversationKey,
  type DeviceIdentity,
  type WrappedKey,
} from './chatCrypto';

// Unwrapped keys, kept in memory for this page load only.
const keyCache = new Map<string, ConversationKey>();
const cacheKey = (userId: string, conversationId: string, version: number) => `${userId}|${conversationId}|${version}`;

/** Unwraps (and caches) a conversation key wrapped for this device. Null if it doesn't open. */
export async function openKey(
  identity: DeviceIdentity,
  userId: string,
  conversationId: string,
  version: number,
  w: WrappedKey
): Promise<ConversationKey | null> {
  const ck = cacheKey(userId, conversationId, version);
  const hit = keyCache.get(ck);
  if (hit) return hit;
  try {
    const key = await unwrap(identity, w, { conversationId, keyVersion: version, userId });
    keyCache.set(ck, key);
    return key;
  } catch {
    return null;
  }
}

export function cachedKey(userId: string, conversationId: string, version: number) {
  return keyCache.get(cacheKey(userId, conversationId, version)) ?? null;
}

const registered = new Map<string, Promise<void>>();

/** This browser's device key, registered with the server. Null until ready (or if unsupported). */
export function useChatDevice(): { identity: DeviceIdentity | null; error: boolean } {
  const { user } = useAuth();
  const register = useMutation(api.messages.registerDevice);
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id || !user.sessionToken) return;
    if (!chatSupported()) {
      setError(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const id = await getDeviceIdentity(user.id);
        const regKey = `${user.id}|${id.deviceId}`;
        let p = registered.get(regKey);
        if (!p) {
          p = register({ sessionToken: user.sessionToken, deviceId: id.deviceId, publicKey: id.publicJwk }).then(() => {});
          registered.set(regKey, p);
          p.catch(() => registered.delete(regKey));
        }
        await p;
        if (!cancelled) setIdentity(id);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.sessionToken, register]);

  return { identity, error };
}

/**
 * Runs on every page for logged-in players: registers this browser's chat key
 * and passes keys on to member devices that don't have them yet.
 */
export function useBackgroundKeySharing() {
  const { user } = useAuth();
  const { identity } = useChatDevice();
  const pending = useQuery(
    api.messages.pendingKeyShares,
    identity && user?.sessionToken ? { sessionToken: user.sessionToken, deviceId: identity.deviceId } : 'skip'
  );
  const shareKeys = useMutation(api.messages.shareKeys);
  const tried = useRef(new Set<string>());

  useEffect(() => {
    if (!pending?.length || !identity || !user?.id || !user.sessionToken) return;
    const token = user.sessionToken;
    const userId = user.id;
    (async () => {
      for (const p of pending) {
        const sig = `${p.conversationId}:${p.missing.map((m) => `${m.userId}|${m.deviceId}|${m.keyVersion}`).join(',')}`;
        if (tried.current.has(sig)) continue;
        tried.current.add(sig);
        for (const k of p.myKeys) await openKey(identity, userId, p.conversationId, k.keyVersion, k);
        const wraps = (
          await Promise.all(
            p.missing.map(async (m) => {
              const key = cachedKey(userId, p.conversationId, m.keyVersion);
              if (!key) return null;
              return {
                keyVersion: m.keyVersion,
                userId: m.userId,
                deviceId: m.deviceId,
                ...(await wrapFor(key.raw as Uint8Array<ArrayBuffer>, m.publicKey, {
                  conversationId: p.conversationId,
                  keyVersion: m.keyVersion,
                  userId: m.userId,
                  deviceId: m.deviceId,
                })),
              };
            })
          )
        ).filter((w): w is NonNullable<typeof w> => !!w);
        if (wraps.length) {
          await shareKeys({ sessionToken: token, conversationId: p.conversationId, wraps }).catch(() => tried.current.delete(sig));
        }
      }
    })();
  }, [pending, identity, user?.id, user?.sessionToken, shareKeys]);
}

const errCode = (e: unknown) => {
  const d = (e as any)?.data;
  return typeof d === 'string' ? d : '';
};

/**
 * Keys for one conversation. Makes a new key when the members changed,
 * shares keys with member devices that lack them, and sends / decrypts.
 */
export function useConversationKeys(conversationId: Id<'conversations'> | null, identity: DeviceIdentity | null) {
  const { user } = useAuth();
  const token = user?.sessionToken;
  const state = useQuery(
    api.messages.keyState,
    conversationId && identity && token ? { sessionToken: token, conversationId, deviceId: identity.deviceId } : 'skip'
  );
  const rotateKey = useMutation(api.messages.rotateKey);
  const shareKeys = useMutation(api.messages.shareKeys);
  const sendMutation = useMutation(api.messages.sendMessage);

  // Bumped whenever a key lands in the cache, so the view re-decrypts.
  const [keysTick, setKeysTick] = useState(0);
  const rotating = useRef(false);
  const sharedSig = useRef('');

  /** Makes a new key, wrapped for every member device. */
  const rotate = useCallback(async (): Promise<boolean> => {
    if (!conversationId || !identity || !token || !state || !user?.id || rotating.current) return false;
    rotating.current = true;
    try {
      const version = state.keyVersion + 1;
      const raw = newConversationKey();
      const wraps = await Promise.all(
        state.devices.map(async (d) => ({
          userId: d.userId,
          deviceId: d.deviceId,
          ...(await wrapFor(raw, d.publicKey, { conversationId, keyVersion: version, userId: d.userId, deviceId: d.deviceId })),
        }))
      );
      await rotateKey({ sessionToken: token, conversationId, deviceId: identity.deviceId, expectedVersion: state.keyVersion, wraps });
      keyCache.set(cacheKey(user.id, conversationId, version), await importConversationKey(raw));
      setKeysTick((n) => n + 1);
      return true;
    } catch (e) {
      // Someone else made a key or a device appeared: keyState updates and we try again.
      const code = errCode(e);
      if (code !== 'KEY_CHANGED' && code !== 'DEVICES_CHANGED') console.warn('[chat] rotate failed', e);
      return false;
    } finally {
      rotating.current = false;
    }
  }, [conversationId, identity, token, state, user?.id, rotateKey]);

  // Unwrap my keys; make a new key if needed; share with devices that lack one.
  useEffect(() => {
    if (!state || !identity || !conversationId || !user?.id || !token) return;
    let cancelled = false;
    (async () => {
      let added = false;
      for (const k of state.myKeys) {
        if (cachedKey(user.id, conversationId, k.keyVersion)) continue;
        if (await openKey(identity, user.id, conversationId, k.keyVersion, k)) added = true;
      }
      if (cancelled) return;
      if (added) setKeysTick((n) => n + 1);

      if (state.needsRotation) {
        await rotate();
        return;
      }

      // Share what I have with member devices that are missing it (new browsers, new members).
      const todo = state.missing.filter(
        (m) => !(m.userId === user.id && m.deviceId === identity.deviceId) && cachedKey(user.id, conversationId, m.keyVersion)
      );
      const sig = todo.map((m) => `${m.userId}|${m.deviceId}|${m.keyVersion}`).join(',');
      if (!todo.length || sig === sharedSig.current) return;
      sharedSig.current = sig;
      const byDevice = new Map(state.devices.map((d) => [`${d.userId}|${d.deviceId}`, d.publicKey]));
      const wraps = (
        await Promise.all(
          todo.map(async (m) => {
            const pub = byDevice.get(`${m.userId}|${m.deviceId}`);
            const key = cachedKey(user.id, conversationId, m.keyVersion);
            if (!pub || !key) return null;
            return {
              keyVersion: m.keyVersion,
              userId: m.userId,
              deviceId: m.deviceId,
              ...(await wrapFor(key.raw as Uint8Array<ArrayBuffer>, pub, {
                conversationId,
                keyVersion: m.keyVersion,
                userId: m.userId,
                deviceId: m.deviceId,
              })),
            };
          })
        )
      ).filter((w): w is NonNullable<typeof w> => !!w);
      if (!cancelled && wraps.length) {
        shareKeys({ sessionToken: token, conversationId, wraps }).catch(() => {
          sharedSig.current = '';
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, identity, conversationId, user?.id, token, rotate, shareKeys]);

  const hasCurrentKey =
    !!state && !!user?.id && !!conversationId && state.keyVersion > 0 && !!cachedKey(user.id, conversationId, state.keyVersion);

  /** Encrypts and sends. Makes a new key first if this device has none yet. */
  const send = useCallback(
    async (text: string) => {
      if (!conversationId || !token || !user?.id || !state) throw new Error('not ready');
      let version = state.keyVersion;
      let key = version > 0 && !state.needsRotation ? cachedKey(user.id, conversationId, version) : null;
      if (!key) {
        if (!(await rotate())) throw new Error('KEY_CHANGED');
        version = state.keyVersion + 1;
        key = cachedKey(user.id, conversationId, version);
        if (!key) throw new Error('KEY_CHANGED');
      }
      const box = await encryptMessage(key, { text }, { conversationId, keyVersion: version, senderId: user.id });
      await sendMutation({ sessionToken: token, conversationId, keyVersion: version, ...box });
    },
    [conversationId, token, user?.id, state, rotate, sendMutation]
  );

  /** Decrypts one message. Null when this device doesn't have its key (yet). */
  const decrypt = useCallback(
    async (m: { keyVersion: number | null; iv: string | null; ciphertext: string | null; senderId: string }) => {
      if (!conversationId || !user?.id || !m.keyVersion || !m.iv || !m.ciphertext) return null;
      const key = cachedKey(user.id, conversationId, m.keyVersion);
      if (!key) return null;
      try {
        return (await decryptMessage(key, { iv: m.iv, ciphertext: m.ciphertext }, { conversationId, keyVersion: m.keyVersion, senderId: m.senderId })).text;
      } catch {
        return null;
      }
    },
    // keysTick: a new key may open messages that failed before
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, user?.id, keysTick]
  );

  return {
    ready: !!state,
    devices: state?.devices ?? [],
    hasCurrentKey,
    keysTick,
    send,
    decrypt,
  };
}
