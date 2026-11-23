'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ShareButton, ShareSheet, type ShareItem } from './ShareSheet';

/**
 * A post's photos full screen. Arrows / swipe move between photos; Esc, the X
 * or a tap on the dark background closes it.
 */
export function PhotoViewer({
  urls,
  types,
  start,
  onClose,
  share,
}: {
  urls: string[];
  /** 'video' plays the item instead of showing it as a photo (default: all photos) */
  types?: ('image' | 'video')[];
  start: number;
  onClose: () => void;
  /** Shows a share button; gives what to share for the item at that index */
  share?: (index: number) => ShareItem;
}) {
  const { t } = useTranslation();
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const [sharing, setSharing] = useState<ShareItem | null>(null);
  const many = urls.length > 1;
  const go = (d: number) => setI((n) => (n + d + urls.length) % urls.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && many) go(1);
      else if (e.key === 'ArrowLeft' && many) go(-1);
    };
    window.addEventListener('keydown', onKey);
    // The page behind doesn't scroll while the photo is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many, onClose]);

  const arrow = 'absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || !many) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      {types?.[i] === 'video' ? (
        <video
          key={urls[i]}
          src={urls[i]}
          controls
          autoPlay
          playsInline
          className="max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urls[i]}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      )}
      {share && (
        <ShareButton
          onClick={() => setSharing(share(i))}
          className="absolute top-4 right-[4.5rem] w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white"
        />
      )}
      {sharing && <ShareSheet item={sharing} onClose={() => setSharing(null)} />}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
        aria-label={t('msg.close')}
        title={t('msg.close')}
      >
        <X className="w-6 h-6" />
      </button>
      {many && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} className={`${arrow} left-3 sm:left-6`} aria-label={t('cx.bcal.prev')}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} className={`${arrow} right-3 sm:right-6`} aria-label={t('cx.bcal.next')}>
            <ChevronRight className="w-6 h-6" />
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80 bg-black/60 px-3 py-1 rounded-full">
            {i + 1} / {urls.length}
          </p>
        </>
      )}
    </div>,
    document.body
  );
}
