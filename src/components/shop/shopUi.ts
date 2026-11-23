'use client';

import { useCallback, useEffect, useState } from 'react';
import { localeFor } from '@/lib/languages';

/** "€12" or "€12.50". */
export function euro(cents: number): string {
  const n = cents / 100;
  return `€${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)}`;
}

export const CATEGORIES = ['apparel', 'accessories', 'games', 'collectibles', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUS_CLS: Record<string, string> = {
  pending_payment: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  reserved: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  ready: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  shipped: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  collected: 'bg-white/5 text-brand-text-secondary border-white/10',
  cancelled: 'bg-white/5 text-brand-text-muted border-white/10 line-through',
  refunded: 'bg-white/5 text-brand-text-muted border-white/10',
};

export function countryName(code: string, language: string): string {
  try {
    const dn = new Intl.DisplayNames([localeFor(language)], { type: 'region' });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

// ─── Cart (per browser; one cart per shop, since each shop is paid separately) ───

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  // Display snapshot only; the server recomputes every price.
  title: string;
  variantLabel: string;
  image?: string;
  unitPriceCents: number;
  sellerKey: string; // "platform" or the company id
  sellerName: string;
};

const CART_KEY = 'unlocked_cart_v1';
const EVENT = 'unlocked-cart';

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {}
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = useCallback((line: CartLine) => {
    const cur = readCart();
    const i = cur.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
    if (i >= 0) cur[i] = { ...cur[i], ...line, quantity: Math.min(10, cur[i].quantity + line.quantity) };
    else cur.push(line);
    writeCart(cur);
  }, []);

  const setQty = useCallback((productId: string, variantId: string, quantity: number) => {
    const cur = readCart()
      .map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, quantity } : l))
      .filter((l) => l.quantity > 0);
    writeCart(cur);
  }, []);

  const clearSeller = useCallback((sellerKey: string) => {
    writeCart(readCart().filter((l) => l.sellerKey !== sellerKey));
  }, []);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return { lines, add, setQty, clearSeller, count };
}

/** Groups cart lines by shop. */
export function groupBySeller(lines: CartLine[]) {
  const groups = new Map<string, { sellerKey: string; sellerName: string; lines: CartLine[] }>();
  for (const l of lines) {
    const g = groups.get(l.sellerKey) ?? { sellerKey: l.sellerKey, sellerName: l.sellerName, lines: [] };
    g.lines.push(l);
    groups.set(l.sellerKey, g);
  }
  return [...groups.values()];
}
