'use client';

import { useQuery } from 'convex/react';
import { Layers, ExternalLink } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/**
 * The company's latest Instagram posts (convex/instagram.ts). Renders nothing
 * until the company has switched the feed on and the first sync has run.
 */
export function InstagramStrip({ companyId }: { companyId?: string }) {
  const { t } = useTranslation();
  const feed = useQuery(api.instagram.forCompany, companyId ? { companyId: companyId as any } : 'skip');
  if (!feed || feed.posts.length === 0) return null;

  return (
    <div className="panel p-6 md:p-10 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="flex items-center gap-2 text-xl font-display font-bold text-brand-bone">
          <InstagramIcon className="w-5 h-5 text-brand-red-light" />
          {t('room.instagram_title')}
        </h3>
        <a
          href={feed.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-border px-3 py-1.5 text-sm text-brand-text-secondary hover:text-brand-bone hover:border-brand-red/60 transition-colors"
        >
          @{feed.username} · {t('room.instagram_follow')}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {feed.posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('room.instagram_open')}
            className="group relative block aspect-square overflow-hidden rounded-md bg-brand-dark"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt={post.caption || ''}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {post.type === 'carousel' && (
              <Layers className="absolute top-1.5 right-1.5 w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
