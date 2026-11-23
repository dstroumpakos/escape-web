/**
 * Builds a story-size (1080×1920) share image for a photo, Spotify-card style:
 * the photo on a blurred copy of itself, a caption under it and the UNLOCKED
 * mark, ready for Instagram / Facebook stories.
 */

const W = 1080;
const H = 1920;

async function loadImage(url: string): Promise<HTMLImageElement> {
  // Fetch as a blob so the canvas stays readable (no tainting)
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('image');
  const blobUrl = URL.createObjectURL(await res.blob());
  try {
    const img = new Image();
    img.src = blobUrl;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws `img` covering the box (cropped from the centre). */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

/** Cuts text to fit `max` px, adding an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

export async function makeShareCard({
  imageUrl,
  title,
  subtitle,
}: {
  imageUrl: string;
  title: string;
  subtitle?: string;
}): Promise<Blob> {
  const img = await loadImage(imageUrl);
  await Promise.all([
    document.fonts.load('64px Nosifer').catch(() => {}),
    document.fonts.load('800 64px "Noto Serif Display"').catch(() => {}),
    document.fonts.load('500 40px Inter').catch(() => {}),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background: the photo blurred and darkened, with a red glow at the bottom
  ctx.fillStyle = '#080505';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = 'blur(60px) brightness(0.45) saturate(1.2)';
  cover(ctx, img, -120, -120, W + 240, H + 240);
  ctx.restore();
  const glow = ctx.createLinearGradient(0, H * 0.45, 0, H);
  glow.addColorStop(0, 'rgba(8,5,5,0)');
  glow.addColorStop(1, 'rgba(120,6,14,0.75)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '64px Nosifer, "Noto Serif Display", Georgia, serif';
  const un = 'UN';
  const locked = 'LOCKED';
  const wUn = ctx.measureText(un).width;
  const wAll = wUn + ctx.measureText(locked).width;
  const x0 = (W - wAll) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8dcc8';
  ctx.fillText(un, x0, 190);
  ctx.fillStyle = '#ff2a36';
  ctx.shadowColor = 'rgba(255,42,54,0.6)';
  ctx.shadowBlur = 24;
  ctx.fillText(locked, x0 + wUn, 190);
  ctx.shadowBlur = 0;

  // The photo, keeping its shape inside the frame
  const boxW = 900;
  const boxH = 1150;
  const ratio = img.naturalWidth / img.naturalHeight;
  let pw = boxW;
  let ph = pw / ratio;
  if (ph > boxH) {
    ph = boxH;
    pw = ph * ratio;
  }
  const px = (W - pw) / 2;
  const py = 280 + (boxH - ph) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.clip();
  ctx.drawImage(img, px, py, pw, ph);
  ctx.restore();

  // Caption
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 72px "Noto Serif Display", Georgia, serif';
  ctx.fillText(fit(ctx, title, 960), W / 2, 1560);
  if (subtitle) {
    ctx.fillStyle = 'rgba(232,220,200,0.85)';
    ctx.font = '500 42px Inter, system-ui, sans-serif';
    ctx.fillText(fit(ctx, subtitle, 960), W / 2, 1630);
  }
  ctx.fillStyle = 'rgba(232,220,200,0.7)';
  ctx.font = '600 38px Inter, system-ui, sans-serif';
  ctx.fillText('unlocked.gr', W / 2, 1810);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png')
  );
}
