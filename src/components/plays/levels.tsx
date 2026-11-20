'use client';

import { BadgeCheck, ShieldCheck, Handshake, Clock, CircleDashed, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

/**
 * Trust levels of a played room (convex/plays.ts). "confirmed" is a QR stamp
 * (convex/passport.ts); the rest are Rooms Played entries.
 */
export type Level = 'confirmed' | 'verified' | 'vouched' | 'pending' | 'declared' | 'rejected';

export const LEVEL_STYLE: Record<Level, { cls: string; dot: string; Icon: typeof BadgeCheck }> = {
  confirmed: { cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: '#34d399', Icon: BadgeCheck },
  verified: { cls: 'bg-sky-500/10 text-sky-300 border-sky-500/30', dot: '#38bdf8', Icon: ShieldCheck },
  vouched: { cls: 'bg-violet-500/10 text-violet-300 border-violet-500/30', dot: '#a78bfa', Icon: Handshake },
  pending: { cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: '#fbbf24', Icon: Clock },
  declared: { cls: 'bg-white/5 text-brand-text-secondary border-white/10', dot: '#9ca3af', Icon: CircleDashed },
  rejected: { cls: 'bg-red-500/10 text-red-300 border-red-500/30', dot: '#f87171', Icon: XCircle },
};

export function LevelChip({ level, small }: { level: Level; small?: boolean }) {
  const { t } = useTranslation();
  const s = LEVEL_STYLE[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${s.cls} ${small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-semibold whitespace-nowrap`}>
      <s.Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> {t(`pl.level.${level}`)}
    </span>
  );
}

export function formatEscape(seconds: number | null | undefined): string {
  if (!seconds) return '';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "2026-11-20" in the reader's language, without time zone shifts. */
export function formatDay(day: string, locale?: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Uploads a file to Convex storage with a URL from generateUploadUrl. */
export async function uploadFile(getUrl: () => Promise<string>, file: File): Promise<string> {
  const url = await getUrl();
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('Upload failed');
  const { storageId } = await res.json();
  return storageId as string;
}
