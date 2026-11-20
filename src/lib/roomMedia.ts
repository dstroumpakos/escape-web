/**
 * Rating and trailer helpers for room pages and cards.
 *
 * A room can carry a rating from another site (`externalRating`, e.g. EscapeAll),
 * set by the UNLOCKED team. We show whichever has more reviews, our own or the
 * other site's, and always name the other site when it's theirs.
 */

export type ShownRating = {
  rating: number;
  count: number;
  /** Set when the numbers come from another site (e.g. "EscapeAll"). */
  source?: string;
  url?: string;
};

export function shownRating(room: any): ShownRating | null {
  const own = (room?.reviews ?? 0) > 0 ? { rating: room.rating ?? 0, count: room.reviews } : null;
  const ext = room?.externalRating;
  const other =
    ext && ext.count > 0
      ? { rating: ext.rating, count: ext.count, source: ext.source as string, url: ext.url as string | undefined }
      : null;
  if (own && (!other || own.count >= other.count)) return own;
  return other;
}

/** Always one decimal: 4.9, 5.0. */
export function formatRating(r: number): string {
  return (Math.round(r * 10) / 10).toFixed(1);
}

/**
 * Embed address for a stored trailer link (only YouTube / Vimeo are accepted
 * by the backend). Uses youtube-nocookie so nothing is set until it plays.
 */
export function videoEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  if (host === 'youtube.com') {
    const id = u.searchParams.get('v');
    if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1);
    if (/^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').find((p) => /^\d{5,12}$/.test(p));
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return null;
}
