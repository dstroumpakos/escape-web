'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ShieldAlert, Users, Mail, Phone, Save, Ban, RotateCcw, Flag, Trash2, UserX, Check } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import { friendlyError } from '@/lib/errors';

type RoomStatus = 'new' | 'in_review' | 'resolved';
const ROOM_STATUSES: RoomStatus[] = ['new', 'in_review', 'resolved'];

const STATUS_CLS: Record<string, string> = {
  new: 'bg-red-500/10 text-red-400',
  in_review: 'bg-yellow-500/10 text-yellow-400',
  resolved: 'bg-green-500/10 text-green-400',
  active: 'bg-amber-500/10 text-amber-300',
  pending: 'bg-blue-500/10 text-blue-300',
  expired: 'bg-white/5 text-brand-text-secondary',
  voided: 'bg-white/5 text-brand-text-muted line-through',
};

/** Admin queue for both report flows. Reporter identities are visible here only. */
export function AdminReports({ sessionToken }: { sessionToken: string }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'content' | 'rooms' | 'players'>('content');
  const [contentDone, setContentDone] = useState(false);
  const contentReports = useQuery(
    api.moderation.adminContentReports,
    view === 'content' ? { sessionToken, done: contentDone } : 'skip'
  );
  const [filter, setFilter] = useState<RoomStatus | 'all'>('new');
  const roomReports = useQuery(api.reports.adminRoomReports, {
    sessionToken,
    status: filter === 'all' ? undefined : filter,
  });
  const playerReports = useQuery(api.reports.adminPlayerReports, view === 'players' ? { sessionToken } : 'skip');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(['content', 'rooms', 'players'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
              view === v ? 'bg-brand-red text-white' : 'bg-brand-surface border border-white/5 text-brand-text-secondary hover:text-white'
            }`}
          >
            {v === 'content' ? <Flag className="w-4 h-4" /> : v === 'rooms' ? <ShieldAlert className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {t(`admin.reports.view_${v}`)}
          </button>
        ))}
      </div>

      {view === 'content' && (
        <>
          <p className="text-xs text-brand-text-muted">{t('admin.reports.content_help')}</p>
          <div className="flex flex-wrap gap-1.5">
            {([false, true] as const).map((d) => (
              <button
                key={String(d)}
                onClick={() => setContentDone(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  contentDone === d ? 'bg-white/15 text-white' : 'bg-white/5 text-brand-text-secondary hover:text-white'
                }`}
              >
                {t(d ? 'admin.reports.content_done' : 'admin.reports.content_pending')}
              </button>
            ))}
          </div>
          {contentReports === undefined ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : contentReports.length === 0 ? (
            <p className="text-center py-12 text-brand-text-secondary">{t('admin.reports.empty')}</p>
          ) : (
            <div className="space-y-3">
              {contentReports.map((r) => (
                <ContentReportCard key={r._id} sessionToken={sessionToken} report={r} />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'rooms' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(['new', 'in_review', 'resolved', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === s ? 'bg-white/15 text-white' : 'bg-white/5 text-brand-text-secondary hover:text-white'
                }`}
              >
                {t(`admin.reports.status_${s}`)}
              </button>
            ))}
          </div>
          {roomReports === undefined ? (
            <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
          ) : roomReports.length === 0 ? (
            <p className="text-center py-12 text-brand-text-secondary">{t('admin.reports.empty')}</p>
          ) : (
            <div className="space-y-4">
              {roomReports.map((r) => (
                <RoomReportCard key={r._id} sessionToken={sessionToken} report={r} />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'players' &&
        (playerReports === undefined ? (
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        ) : playerReports.length === 0 ? (
          <p className="text-center py-12 text-brand-text-secondary">{t('admin.reports.empty')}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-brand-text-muted">{t('admin.reports.players_help')}</p>
            {playerReports.map((r) => (
              <PlayerReportCard key={r._id} sessionToken={sessionToken} report={r} />
            ))}
          </div>
        ))}
    </div>
  );
}

function RoomReportCard({ sessionToken, report }: { sessionToken: string; report: any }) {
  const { t } = useTranslation();
  const update = useMutation(api.reports.adminUpdateRoomReport);
  const [notes, setNotes] = useState<string>(report.adminNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch: { status?: RoomStatus; adminNotes?: string }) => {
    setBusy(true);
    setError(null);
    try {
      await update({ sessionToken, reportId: report._id, ...patch });
    } catch (err) {
      setError(friendlyError(err, t));
    }
    setBusy(false);
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {t(`reports.room.kind_${report.kind}`)} · {report.room?.title ?? '—'}
          </p>
          <p className="text-xs text-brand-text-secondary">
            {new Date(report.createdAt).toLocaleString()} · {t('admin.reports.game')}: {report.booking?.date} {report.booking?.time}
            {report.booking?.bookingCode ? ` · ${report.booking.bookingCode}` : ''}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLS[report.status]}`}>
          {t(`admin.reports.status_${report.status}`)}
        </span>
      </div>

      <p className="text-sm whitespace-pre-wrap break-words bg-brand-bg rounded-xl p-3">{report.description}</p>

      {report.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {report.photoUrls.map((u: string) => (
            <a key={u} href={u} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-white/10">
              <img src={u} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Contact label={t('admin.reports.business')} person={report.company} />
        <Contact label={t('admin.reports.reporter')} person={report.reporter} note={t('admin.reports.reporter_private')} />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-brand-text-secondary">{t('admin.reports.notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-brand-red focus:outline-hidden resize-y"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={busy || notes === report.adminNotes}
            onClick={() => save({ adminNotes: notes })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" /> {t('admin.reports.save_notes')}
          </button>
          <span className="flex-1" />
          {ROOM_STATUSES.filter((s) => s !== report.status).map((s) => (
            <button
              key={s}
              disabled={busy}
              onClick={() => save({ status: s })}
              className={`px-3 py-1.5 rounded-lg text-sm ${STATUS_CLS[s]} hover:opacity-80 disabled:opacity-40`}
            >
              {t(`admin.reports.mark_${s}`)}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function Contact({ label, person, note }: { label: string; person: any; note?: string }) {
  return (
    <div className="bg-brand-bg rounded-xl p-3 space-y-1 min-w-0">
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-semibold truncate">{person?.name ?? '—'}</p>
      {person?.email && (
        <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 text-xs text-brand-text-secondary hover:text-white truncate">
          <Mail className="w-3 h-3 shrink-0" /> {person.email}
        </a>
      )}
      {person?.phone && (
        <a href={`tel:${person.phone}`} className="flex items-center gap-1.5 text-xs text-brand-text-secondary hover:text-white">
          <Phone className="w-3 h-3 shrink-0" /> {person.phone}
        </a>
      )}
      {note && <p className="text-[11px] text-brand-text-muted">{note}</p>}
    </div>
  );
}

function PlayerReportCard({ sessionToken, report }: { sessionToken: string; report: any }) {
  const { t } = useTranslation();
  const setVoided = useMutation(api.reports.adminSetPlayerReportVoided);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voided = report.state === 'voided';

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 text-sm">
          <p className="font-semibold truncate">
            {report.player?.name ?? '—'} <span className="font-normal text-brand-text-secondary">({report.player?.email})</span>
          </p>
          <p className="text-xs text-brand-text-secondary">
            {t('admin.reports.reported_by')}: {report.company?.name ?? '—'} · {report.room?.title ?? '—'} · {report.booking?.date}{' '}
            {report.booking?.time}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLS[report.state]}`}>
          {t(`admin.reports.state_${report.state}`)}
          {report.state === 'active' && report.gamesRemaining != null
            ? ` · ${t('admin.reports.games_left', { count: String(report.gamesRemaining) })}`
            : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {report.categories.map((c: string) => (
          <span key={c} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-200">
            {t(`reports.cat.${c}`)}
          </span>
        ))}
      </div>
      {report.reply && (
        <p className="text-xs italic border-l-2 border-amber-500/40 pl-2 whitespace-pre-wrap break-words">
          {t('admin.reports.player_reply')}: {report.reply}
        </p>
      )}
      {voided && report.voidedNote && <p className="text-xs text-brand-text-muted">{report.voidedNote}</p>}
      <div className="flex justify-end">
        <button
          disabled={busy}
          onClick={async () => {
            let note: string | undefined;
            if (!voided) {
              const answer = prompt(t('admin.reports.void_prompt'));
              if (answer === null) return;
              note = answer;
            }
            setBusy(true);
            setError(null);
            try {
              await setVoided({ sessionToken, reportId: report._id, voided: !voided, note });
            } catch (err) {
              setError(friendlyError(err, t));
            }
            setBusy(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40"
        >
          {voided ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
          {voided ? t('admin.reports.restore') : t('admin.reports.void')}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

/** A reported post, comment or player (convex/moderation.ts). Apple expects action within 24 hours. */
function ContentReportCard({ sessionToken, report }: { sessionToken: string; report: any }) {
  const { t } = useTranslation();
  const resolve = useMutation(api.moderation.adminResolveContentReport);
  const setSuspended = useMutation(api.moderation.adminSetSuspended);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = report.status === 'pending';
  const hasContent = report.kind !== 'user' && !report.removed;
  const author = report.author;

  const run = async (fn: () => Promise<unknown>, confirmKey?: string) => {
    if (confirmKey && !confirm(t(confirmKey))) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err, t));
    }
    setBusy(false);
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {t(`admin.reports.kind_${report.kind}`)}
            {report.context ? ` · ${t(`admin.reports.context_${report.context}`)}` : ''}
            {' · '}
            <span className="text-amber-200">{t(`admin.reports.reason_${report.reason}`)}</span>
          </p>
          <p className="text-xs text-brand-text-secondary">
            {new Date(report.createdAt).toLocaleString()} · {t('admin.reports.reported_by')}: {report.reporter?.name ?? '—'}
            {report.reporter?.email ? ` (${report.reporter.email})` : ''}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${pending ? STATUS_CLS.new : STATUS_CLS.resolved}`}>
          {t(`admin.reports.cstatus_${report.status}`)}
        </span>
      </div>

      {report.removed ? (
        <p className="text-sm italic text-brand-text-muted">{t('admin.reports.content_gone')}</p>
      ) : report.text || report.imageUrl ? (
        <div className="bg-brand-bg rounded-xl p-3 space-y-2">
          {report.imageUrl && (
            <a href={report.imageUrl} target="_blank" rel="noreferrer" className="block w-32 h-32 rounded-lg overflow-hidden border border-white/10">
              <img src={report.imageUrl} alt="" className="w-full h-full object-cover" />
            </a>
          )}
          {report.text && <p className="text-sm whitespace-pre-wrap break-words">{report.text}</p>}
        </div>
      ) : null}
      {report.details && (
        <p className="text-xs border-l-2 border-amber-500/40 pl-2 whitespace-pre-wrap break-words">
          {t('admin.reports.details')}: {report.details}
        </p>
      )}

      {author && (
        <p className="text-xs text-brand-text-secondary">
          {t('admin.reports.author')}: <span className="text-white font-medium">{author.name}</span>
          {author.email ? ` (${author.email})` : ''}
          {author.reportsAboutAuthor > 0 ? ` · ${t('admin.reports.author_reports', { count: String(author.reportsAboutAuthor) })}` : ''}
          {author.suspended && <span className="ml-2 text-red-400 font-semibold">{t('admin.reports.suspended')}</span>}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {pending && (
          <button
            disabled={busy}
            onClick={() => run(() => resolve({ sessionToken, reportId: report._id, action: 'dismiss' }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" /> {t('admin.reports.dismiss')}
          </button>
        )}
        {hasContent && (
          <button
            disabled={busy}
            onClick={() => run(() => resolve({ sessionToken, reportId: report._id, action: 'remove' }), 'admin.reports.remove_confirm')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t('admin.reports.remove')}
          </button>
        )}
        {author?.userId && !author.suspended && (
          <button
            disabled={busy}
            onClick={() => run(() => resolve({ sessionToken, reportId: report._id, action: 'suspend' }), 'admin.reports.suspend_confirm')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-40"
          >
            <UserX className="w-3.5 h-3.5" /> {t('admin.reports.suspend')}
          </button>
        )}
        {author?.userId && author.suspended && (
          <button
            disabled={busy}
            onClick={() => run(() => setSuspended({ sessionToken, userId: author.userId, suspended: false }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t('admin.reports.unsuspend')}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
