'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crop, Loader2, Undo2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { CARD_RATIO } from '@/lib/roomPoster';

/**
 * The room's card in the Companies section (convex/roomPoster.ts): the room
 * photo cropped to the card's frame. Used in the company portal (new / edit
 * room) and in admin → managed companies, so both crop it the same way.
 *
 * The form bumps `requestCrop` right after a new room photo is uploaded, so the
 * crop window opens on its own; "Crop" opens it again later. The crop is saved
 * as its own image (posterImage); the room photo itself never changes.
 */
export function RoomCardCrop({
  image,
  posterImage,
  onChange,
  upload,
  requestCrop = 0,
}: {
  image: string;
  posterImage: string;
  onChange: (posterImage: string) => void;
  upload: (file: File) => Promise<string>;
  requestCrop?: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const firstRequest = useRef(requestCrop);

  useEffect(() => {
    if (requestCrop !== firstRequest.current && image) setOpen(true);
  }, [requestCrop, image]);

  const shown = posterImage || image;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-brand-bone">{t('rp.title')}</p>
      <p className="text-xs text-brand-text-secondary mt-1 mb-4 max-w-[65ch]">{t('rp.hint')}</p>

      <div className="flex gap-5 items-start">
        <div className="relative w-28 shrink-0 rounded-xl overflow-hidden bg-black/40 border border-brand-border shadow-lg shadow-black/40" style={{ aspectRatio: `${CARD_RATIO}` }}>
          {shown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          {image ? (
            <>
              <p className="text-xs text-brand-text-secondary mb-3">{posterImage ? t('rp.cropped') : t('rp.not_cropped')}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setOpen(true)} className="btn-primary text-xs py-1.5! px-3! flex items-center gap-1.5">
                  <Crop className="w-3.5 h-3.5" /> {posterImage ? t('rp.recrop') : t('rp.crop')}
                </button>
                {posterImage && (
                  <button type="button" onClick={() => onChange('')} className="btn-ghost text-xs py-1.5! px-3! flex items-center gap-1.5">
                    <Undo2 className="w-3.5 h-3.5" /> {t('rp.reset')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-brand-text-secondary">{t('rp.no_image')}</p>
          )}
        </div>
      </div>

      {open && image && (
        <CropDialog
          src={image}
          onClose={() => setOpen(false)}
          onSave={async (file) => {
            onChange(await upload(file));
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Loads a stored photo so it can be drawn on a canvas (Convex storage allows it, like PhotosTool). */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load'));
    img.src = src;
  });
}

const MAX_ZOOM = 4;
const PAD = 28; // dimmed photo shown around the frame

function CropDialog({ src, onClose, onSave }: { src: string; onClose: () => void; onSave: (file: File) => Promise<void> }) {
  const { t } = useTranslation();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // photo centre relative to the frame centre, px
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // The frame: the card's shape, as big as fits the screen
  const [fw, setFw] = useState(300);
  useEffect(() => {
    const fit = () => setFw(Math.max(180, Math.min(300, window.innerWidth - 2 * PAD - 48, (window.innerHeight - 260) * CARD_RATIO)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const fh = fw / CARD_RATIO;

  useEffect(() => {
    let alive = true;
    loadImage(src).then((i) => alive && setImg(i)).catch(() => alive && setErr(t('rp.load_failed')));
    return () => { alive = false; };
  }, [src, t]);

  // Scale at which the photo just covers the frame; zoom goes up from there
  const cover = img ? Math.max(fw / img.naturalWidth, fh / img.naturalHeight) : 1;
  const s = cover * zoom;
  const w = img ? img.naturalWidth * s : 0;
  const h = img ? img.naturalHeight * s : 0;

  // Never leave an empty strip inside the frame
  const clampOff = useCallback(
    (o: { x: number; y: number }, ww = w, hh = h) => ({
      x: Math.max(-(ww - fw) / 2, Math.min((ww - fw) / 2, o.x)),
      y: Math.max(-(hh - fh) / 2, Math.min((hh - fh) / 2, o.y)),
    }),
    [w, h, fw, fh]
  );

  const setZoomClamped = useCallback(
    (z: number) => {
      if (!img) return;
      const nz = Math.max(1, Math.min(MAX_ZOOM, z));
      const ns = cover * nz;
      setZoom(nz);
      // Keep the same point in the middle while zooming
      setOff((o) => clampOff({ x: (o.x * nz) / zoom, y: (o.y * nz) / zoom }, img.naturalWidth * ns, img.naturalHeight * ns));
    },
    [img, cover, zoom, clampOff]
  );

  // Mouse wheel / trackpad zoom (native listener: React's wheel events can't stop the page scrolling)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, setZoomClamped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  const save = async () => {
    if (!img) return;
    setBusy(true);
    setErr('');
    try {
      // The part of the photo inside the frame, in the photo's own pixels
      const left = fw / 2 - w / 2 + off.x;
      const top = fh / 2 - h / 2 + off.y;
      const sx = -left / s;
      const sy = -top / s;
      const sw = fw / s;
      const sh = fh / s;
      const outW = Math.round(Math.min(1000, sw));
      const outH = Math.round(outW / CARD_RATIO);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('blob');
      await onSave(new File([blob], 'room-card.jpg', { type: 'image/jpeg' }));
    } catch {
      setErr(t('rp.upload_failed'));
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 max-w-full shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="font-semibold text-brand-bone">{t('rp.modal_title')}</h3>
          <button type="button" onClick={onClose} disabled={busy} className="text-brand-text-secondary hover:text-white" aria-label={t('rp.cancel')}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-brand-text-secondary mb-4" style={{ maxWidth: fw + 2 * PAD }}>{t('rp.modal_hint')}</p>

        <div
          ref={stageRef}
          className="relative mx-auto overflow-hidden rounded-xl bg-black touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ width: fw + 2 * PAD, height: fh + 2 * PAD }}
          onPointerDown={(e) => {
            if (!img) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setOff(clampOff({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute max-w-none pointer-events-none"
              style={{ width: w, height: h, left: PAD + fw / 2 - w / 2 + off.x, top: PAD + fh / 2 - h / 2 + off.y }}
            />
          ) : !err ? (
            <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>
          ) : null}
          {/* The card's frame; everything outside it is dimmed */}
          <div
            className="absolute rounded-lg border-2 border-white/90 pointer-events-none"
            style={{ left: PAD, top: PAD, width: fw, height: fh, boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
          />
        </div>

        <div className="flex items-center gap-3 mt-4 mx-auto" style={{ maxWidth: fw + 2 * PAD }}>
          <button type="button" onClick={() => setZoomClamped(zoom / 1.2)} className="text-brand-text-secondary hover:text-white" aria-label={t('rp.zoom')}>
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomClamped(Number(e.target.value))}
            className="flex-1 accent-brand-red"
            aria-label={t('rp.zoom')}
            disabled={!img}
          />
          <button type="button" onClick={() => setZoomClamped(zoom * 1.2)} className="text-brand-text-secondary hover:text-white" aria-label={t('rp.zoom')}>
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {err && <p className="text-xs text-red-300 mt-3" style={{ maxWidth: fw + 2 * PAD }}>{err}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost text-sm py-2! px-4!">{t('rp.cancel')}</button>
          <button type="button" onClick={save} disabled={!img || busy} className="btn-primary text-sm py-2! px-4! flex items-center gap-2 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {busy ? t('rp.saving') : t('rp.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
