'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Download, Link2, Loader2, Share2, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { makeShareCard } from '@/lib/shareCard';

/** What gets shared: a photo (made into a story card) or a video (link only). */
export type ShareItem = {
  url: string;
  type?: 'image' | 'video';
  /** Big line on the card, e.g. the room or company name */
  title: string;
  /** Small line under it, e.g. "Team Owls · Escaped in 52'" */
  subtitle?: string;
  /** Page the share links back to, e.g. "/companies/…" */
  path: string;
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37A9.86 9.86 0 0 1 2.16 12C2.16 6.55 6.6 2.11 12.06 2.11c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.89 9.89M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.31-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.49-8.41" />
    </svg>
  );
}

/**
 * Share sheet, Spotify style: shows the story card and lets the player send it
 * to Instagram / Facebook (the phone's share menu), download it, or share the link.
 */
export function ShareSheet({ item, onClose }: { item: ShareItem; onClose: () => void }) {
  const { t } = useTranslation();
  const isVideo = item.type === 'video';
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const link = typeof window !== 'undefined' ? window.location.origin + item.path : item.path;

  useEffect(() => {
    if (isVideo) return;
    let alive = true;
    let made: string | null = null;
    makeShareCard({ imageUrl: item.url, title: item.title, subtitle: item.subtitle })
      .then((blob) => {
        if (!alive) return;
        made = URL.createObjectURL(blob);
        setCard({ blob, url: made });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [item.url, item.title, item.subtitle, isVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const file = card ? new File([card.blob], 'unlocked-story.png', { type: 'image/png' }) : null;
  const canShareFile = !!file && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
  const canShareLink = typeof navigator !== 'undefined' && !!navigator.share;

  const shareNative = async () => {
    setBusy(true);
    try {
      if (canShareFile && file) await navigator.share({ files: [file] });
      else await navigator.share({ title: item.title, url: link });
    } catch {
      // Closed the menu: nothing to do
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    if (!card) return;
    const a = document.createElement('a');
    a.href = card.url;
    a.download = 'unlocked-story.png';
    a.click();
  };
  const [igSaved, setIgSaved] = useState(false);
  // A website can't open Instagram Stories directly: on a phone the share menu
  // sends the image there; on a computer the image is saved to upload it.
  const instagram = async () => {
    if (canShareFile) return shareNative();
    if (!isVideo && card) {
      download();
      setIgSaved(true);
    } else if (canShareLink) {
      return shareNative();
    } else {
      await copy();
      setIgSaved(true);
    }
  };
  const whatsapp = async () => {
    if (canShareFile) return shareNative();
    window.open(`https://wa.me/?text=${encodeURIComponent(item.title + ' ' + link)}`, '_blank', 'noopener,noreferrer');
  };
  const facebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank', 'noopener,noreferrer,width=640,height=560');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const row = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-sm font-medium disabled:opacity-50';
  const app = 'flex flex-col items-center gap-1.5 text-xs text-brand-text-secondary hover:text-white disabled:opacity-50';
  const circle = 'w-14 h-14 rounded-full flex items-center justify-center text-white';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('sh.title')}
      className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className="w-full sm:max-w-md bg-brand-surface border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('sh.title')}</h2>
          <button onClick={onClose} aria-label={t('msg.close')} className="p-1 text-brand-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isVideo && (
          <div className="mx-auto mb-5 w-44 aspect-[9/16] rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
            {card ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.url} alt={t('sh.preview')} className="w-full h-full object-cover" />
            ) : failed ? (
              <p className="text-xs text-brand-text-muted px-3 text-center">{t('sh.card_failed')}</p>
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-brand-text-muted" />
            )}
          </div>
        )}

        {/* One tap per app, like Spotify's share menu; Instagram first, it's what most players use */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button onClick={instagram} disabled={busy || (!isVideo && !card && !failed)} className={app}>
            <span className={`${circle} bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]`}>
              <InstagramIcon className="w-7 h-7" />
            </span>
            Instagram
          </button>
          <button onClick={facebook} className={app}>
            <span className={`${circle} bg-[#1877f2]`}><FacebookIcon className="w-7 h-7" /></span>
            Facebook
          </button>
          <button onClick={whatsapp} disabled={busy} className={app}>
            <span className={`${circle} bg-[#25d366]`}><WhatsAppIcon className="w-7 h-7" /></span>
            WhatsApp
          </button>
          {canShareLink ? (
            <button onClick={shareNative} disabled={busy} className={app}>
              <span className={`${circle} bg-white/10`}><Share2 className="w-6 h-6" /></span>
              {t('sh.more')}
            </button>
          ) : (
            <button onClick={download} disabled={!card} className={app}>
              <span className={`${circle} bg-white/10`}><Download className="w-6 h-6" /></span>
              {t('sh.save')}
            </button>
          )}
        </div>
        {igSaved && <p className="text-xs text-brand-bone bg-white/5 rounded-lg px-3 py-2 mb-3">{t('sh.ig_saved')}</p>}

        <div className="space-y-2">
          {!isVideo && canShareLink && (
            <button onClick={download} disabled={!card} className={row}>
              <Download className="w-5 h-5 text-brand-red-light" /> {t('sh.download')}
            </button>
          )}
          <button onClick={copy} className={row}>
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Link2 className="w-5 h-5 text-brand-text-secondary" />}
            {copied ? t('sh.copied') : t('sh.copy_link')}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

/** Small round "share" button for photo viewers and post windows. */
export function ShareButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={t('sh.title')}
      title={t('sh.title')}
      className={`flex items-center justify-center gap-1.5 ${className}`}
    >
      <Share2 className="w-5 h-5" />
    </button>
  );
}
