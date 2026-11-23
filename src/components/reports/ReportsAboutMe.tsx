'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ShieldAlert, MessageSquare, CalendarX } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';
import { PLAYER_REPLY_MAX_CHARS } from '../../../convex/reportRules';
import { localeFor } from '@/lib/languages';

/**
 * Reports businesses filed about this player. Shows nothing while the player
 * has no active reports. Never shows which business, room or date: the server
 * only returns categories and the player's own replies.
 */
export function ReportsAboutMe({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const standing = useQuery(api.reports.myStanding, { sessionToken });
  if (!standing || !standing.active) return null;

  return (
    <section className="pb-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              {t('reports.me.title')}
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1">{t('reports.me.intro')}</p>
            <p className="text-sm text-amber-200 mt-2">
              {t(standing.gamesRemaining === 1 ? 'reports.me.expires_one' : 'reports.me.expires_many', {
                count: String(standing.gamesRemaining),
              })}
            </p>
          </div>
          <ul className="space-y-3">
            {standing.reports.map((r) => (
              <ReportRow key={r._id} sessionToken={sessionToken} report={r} />
            ))}
          </ul>
          <p className="text-xs text-brand-text-muted">{t('reports.me.privacy')}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * The player's late cancellations. Shows nothing until they have one; says
 * when businesses start seeing a warning and when the oldest one stops counting.
 */
export function LateCancelsAboutMe({ sessionToken }: { sessionToken: string }) {
  const { t, language } = useTranslation();
  const late = useQuery(api.cancellations.myLateCancels, { sessionToken });
  if (!late || late.count === 0) return null;
  const expires = late.oldestExpiresAt
    ? new Date(late.oldestExpiresAt).toLocaleDateString(localeFor(language), { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <section className="pb-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`rounded-2xl border p-5 space-y-2 ${
            late.flagged ? 'border-orange-500/40 bg-orange-500/10' : 'border-white/10 bg-white/5'
          }`}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarX className={`w-5 h-5 ${late.flagged ? 'text-orange-400' : 'text-brand-text-secondary'}`} />
            {t(late.count === 1 ? 'cancel.me.title_one' : 'cancel.me.title_many', {
              count: String(late.count),
              days: String(late.lookbackDays),
            })}
          </h2>
          <p className="text-sm text-brand-text-secondary">
            {t(late.flagged ? 'cancel.me.flagged' : 'cancel.me.not_flagged', {
              threshold: String(late.threshold),
              days: String(late.lookbackDays),
            })}
          </p>
          {expires && <p className="text-xs text-brand-text-muted">{t('cancel.me.expires', { date: expires })}</p>}
        </div>
      </div>
    </section>
  );
}

function ReportRow({
  sessionToken,
  report,
}: {
  sessionToken: string;
  report: { _id: string; categories: string[]; reply: string | null };
}) {
  const { t } = useTranslation();
  const reply = useMutation(api.reports.replyToReport);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(report.reply ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="rounded-xl bg-brand-bg/60 border border-white/5 p-4 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {report.categories.map((c) => (
          <span key={c} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-200">
            {t(`reports.cat.${c}`)}
          </span>
        ))}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, PLAYER_REPLY_MAX_CHARS))}
            rows={3}
            className="w-full bg-brand-surface border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-red focus:outline-hidden resize-y"
            placeholder={t('reports.me.reply_placeholder')}
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-brand-text-muted">
              {text.length}/{PLAYER_REPLY_MAX_CHARS}
            </span>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setText(report.reply ?? ''); }} className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">
                {t('reports.cancel')}
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setError(null);
                  try {
                    await reply({ sessionToken, reportId: report._id as any, reply: text });
                    setEditing(false);
                  } catch (err) {
                    setError(friendlyError(err, t));
                  }
                  setSaving(false);
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-brand-red text-white disabled:opacity-40"
              >
                {t('reports.me.reply_save')}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : report.reply ? (
        <div className="text-sm">
          <p className="text-xs text-brand-text-secondary mb-1">{t('reports.me.your_reply')}</p>
          <p className="whitespace-pre-wrap break-words">{report.reply}</p>
          <button onClick={() => setEditing(true)} className="mt-1 text-xs text-brand-red-light hover:underline">
            {t('reports.me.reply_edit')}
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-brand-red-light hover:underline flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {t('reports.me.reply_button')}
        </button>
      )}
    </li>
  );
}
