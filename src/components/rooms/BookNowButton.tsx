'use client';

import Link from 'next/link';
import { useMutation } from 'convex/react';
import { DoorOpen, ExternalLink, Phone } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED } from '@/lib/features';
import { visitorId } from '@/lib/visitorId';

type Target = { kind: 'url'; url: string } | { kind: 'phone'; phone: string } | null | undefined;

/**
 * "Book now" on a room. With UNLOCKED's booking off (the default), it sends
 * the player to the escape room's own site (or calls them), and counts the click.
 */
export function BookNowButton({
  roomId,
  target,
  className = 'btn-primary flex items-center justify-center gap-2 text-lg py-4! px-10!',
}: {
  roomId: string;
  target: Target;
  className?: string;
}) {
  const { t } = useTranslation();
  const track = useMutation(api.externalLinks.trackBookClick);

  if (BOOKING_ENABLED) {
    return (
      <Link href={`/rooms/${roomId}/book`} className={className}>
        {t('room.book_now')}
        <DoorOpen className="w-5 h-5" />
      </Link>
    );
  }
  if (!target) return null;
  const onClick = () => {
    track({ roomId: roomId as any, visitorId: visitorId() }).catch(() => {});
  };
  if (target.kind === 'phone') {
    return (
      <a href={`tel:${target.phone.replace(/[^0-9+]/g, '')}`} onClick={onClick} className={className}>
        <Phone className="w-5 h-5" />
        {t('room.call_to_book')} {target.phone}
      </a>
    );
  }
  return (
    <a href={target.url} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
      {t('room.book_now')}
      <ExternalLink className="w-5 h-5" />
    </a>
  );
}
