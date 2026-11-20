'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, X } from 'lucide-react';

/** Round avatar: photo, else the first letter (or a group icon). */
export function Avatar({ src, name, size = 40, group = false }: { src?: string | null; name: string; size?: number; group?: boolean }) {
  return (
    <div
      className="rounded-full bg-brand-bg border border-brand-border/60 overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : group ? (
        <Users className="text-brand-red-light" style={{ width: size * 0.45, height: size * 0.45 }} />
      ) : (
        <span className="font-bold text-brand-red-light" style={{ fontSize: size * 0.4 }}>
          {(name || '?').charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/** Dialog rendered on <body> (page animations would otherwise trap "fixed"). */
export function ChatModal({
  title,
  onClose,
  children,
  closeLabel,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/75 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-brand-surface border border-brand-border w-full sm:max-w-md max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-brand-border shrink-0">
          <h3 className="font-bold text-brand-bone">{title}</h3>
          <button onClick={onClose} aria-label={closeLabel} className="text-brand-text-muted hover:text-brand-bone">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function formatTime(ts: number, lang: string): string {
  const d = new Date(ts);
  const now = new Date();
  const locale = lang === 'el' ? 'el-GR' : lang === 'nl' ? 'nl-NL' : 'en-GB';
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const days = (now.getTime() - ts) / 86_400_000;
  if (days < 6) return d.toLocaleDateString(locale, { weekday: 'short' });
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
