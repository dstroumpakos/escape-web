'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { ArrowLeft, Info, Loader2, Lock, SendHorizontal } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import type { DeviceIdentity } from '@/lib/chatCrypto';
import { useConversationKeys } from '@/lib/useChat';
import { Avatar } from './ChatUi';
import { ChatInfo } from './ChatInfo';
import { localeFor } from '@/lib/languages';

const MAX_TEXT = 2000;

type Msg = {
  _id: string;
  senderId: string;
  kind: 'text' | 'event';
  keyVersion: number | null;
  iv: string | null;
  ciphertext: string | null;
  event: { type: string; userIds?: string[] } | null;
  createdAt: number;
};

export function ConversationView({
  conversationId,
  identity,
  onBack,
  onLeft,
}: {
  conversationId: Id<'conversations'>;
  identity: DeviceIdentity;
  onBack: () => void;
  onLeft: () => void;
}) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken;
  const conv = useQuery(api.messages.getConversation, token ? { sessionToken: token, conversationId } : 'skip');
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.listMessages,
    token ? { sessionToken: token, conversationId } : 'skip',
    { initialNumItems: 40 }
  );
  const keys = useConversationKeys(conversationId, identity);
  const markRead = useMutation(api.messages.markRead);

  const [plain, setPlain] = useState<Record<string, string | null>>({});
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Oldest first for display.
  const messages = useMemo(() => [...(results as Msg[])].reverse(), [results]);
  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of conv?.members ?? []) m.set(p._id, p.name);
    return m;
  }, [conv?.members]);

  // Reset when switching chats.
  useEffect(() => {
    setPlain({});
    setText('');
    setErr('');
    stickToBottom.current = true;
  }, [conversationId]);

  // Decrypt what we can (again when a new key arrives).
  const { decrypt, keysTick } = keys;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string | null> = {};
      for (const m of messages) {
        if (m.kind !== 'text') continue;
        if (plain[m._id]) continue;
        next[m._id] = await decrypt(m);
      }
      if (!cancelled && Object.keys(next).length) setPlain((p) => ({ ...p, ...next }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, decrypt, keysTick]);

  // Mark read when new messages arrive while the chat is open.
  const newest = messages.length ? messages[messages.length - 1].createdAt : 0;
  useEffect(() => {
    if (token && newest && document.visibilityState === 'visible') markRead({ sessionToken: token, conversationId }).catch(() => {});
  }, [newest, token, conversationId, markRead]);

  // Keep the view at the bottom unless the player scrolled up to read.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, plain]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr('');
    try {
      await keys.send(body);
      setText('');
      stickToBottom.current = true;
      inputRef.current?.focus();
    } catch (e) {
      const msg = cleanError(e);
      setErr(msg === 'KEY_CHANGED' || msg === 'not ready' || !msg ? t('msg.send_failed') : msg);
    } finally {
      setSending(false);
    }
  };

  const nameOf = (id: string) => (id === user?.id ? t('msg.you') : names.get(id) || t('msg.deleted_user'));

  const eventText = (m: Msg) => {
    const who = (m.event?.userIds ?? []).map(nameOf).join(', ');
    const name = nameOf(m.senderId);
    const type = m.event?.type;
    if (!type || !['created', 'added', 'removed', 'left', 'renamed'].includes(type)) return '';
    // "You created the group" reads better than "<You> created the group".
    return t(`msg.ev_${type}${m.senderId === user?.id ? '_me' : ''}`, { name, who });
  };

  const locale = localeFor(language);
  const dayOf = (ts: number) => new Date(ts).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });

  if (conv === null) {
    return <div className="flex-1 flex items-center justify-center text-sm text-brand-text-muted p-6">{t('pf.not_found')}</div>;
  }

  const isGroup = conv?.kind === 'group';
  const blocked = !!conv?.blocked;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-brand-border/60 shrink-0">
        <button onClick={onBack} className="md:hidden p-1 -ml-1 text-brand-text-muted hover:text-brand-bone" aria-label={t('msg.back')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        {conv ? (
          <>
            {conv.otherUserId ? (
              <Link href={`/u/${conv.otherUserId}`} aria-label={t('msg.view_profile')}>
                <Avatar src={conv.avatar} name={conv.name} />
              </Link>
            ) : (
              <Avatar name={conv.name} group />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-bone truncate">{conv.name || t('msg.deleted_user')}</p>
              <p className="text-[11px] text-green-400/90 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {isGroup ? `${t('msg.members', { n: String(conv.members.length) })} · ` : ''}
                {t('msg.e2e')}
              </p>
            </div>
            <button onClick={() => setShowInfo(true)} className="p-2 text-brand-text-muted hover:text-brand-bone" aria-label={t('msg.info')} title={t('msg.info')}>
              <Info className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="h-10 flex-1 rounded bg-brand-bg animate-pulse" />
        )}
      </header>

      {/* Messages */}
      <div ref={scroller} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-1.5">
        {status === 'CanLoadMore' && (
          <div className="text-center pb-2">
            <button onClick={() => loadMore(40)} className="text-xs text-brand-text-muted hover:text-brand-bone underline">{t('msg.load_older')}</button>
          </div>
        )}
        {status === 'LoadingFirstPage' && <Loader2 className="w-5 h-5 animate-spin mx-auto mt-8 text-brand-text-muted" />}
        {status !== 'LoadingFirstPage' && messages.filter((m) => m.kind === 'text').length === 0 && (
          <p className="text-center text-sm text-brand-text-muted pt-8">{t('msg.no_messages')}</p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const dayLabel = newDay ? (
            <div className="text-center text-[11px] text-brand-text-muted py-2 first-letter:uppercase">{dayOf(m.createdAt)}</div>
          ) : null;
          if (m.kind === 'event') {
            return (
              <div key={m._id}>
                {dayLabel}
                <p className="text-center text-xs text-brand-text-muted py-1">{eventText(m)}</p>
              </div>
            );
          }
          const mine = m.senderId === user?.id;
          const firstOfRun = !prev || prev.senderId !== m.senderId || prev.kind !== 'text' || newDay;
          const body = plain[m._id];
          const time = new Date(m.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={m._id}>
              {dayLabel}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${firstOfRun ? 'pt-1.5' : ''}`}>
                <div className={`max-w-[80%] sm:max-w-[70%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {isGroup && !mine && firstOfRun && <span className="text-[11px] text-brand-red-light px-2 mb-0.5">{nameOf(m.senderId)}</span>}
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      mine ? 'bg-brand-red text-white rounded-br-md' : 'bg-brand-bg border border-brand-border/60 text-brand-text rounded-bl-md'
                    }`}
                  >
                    {body === undefined ? (
                      <span className="opacity-60">…</span>
                    ) : body === null ? (
                      <span className="italic opacity-70 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 shrink-0" />{t('msg.no_key')}</span>
                    ) : (
                      body
                    )}
                    <span className={`block text-[10px] mt-0.5 text-right ${mine ? 'text-white/70' : 'text-brand-text-muted'}`}>{time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-brand-border/60 p-3 shrink-0">
        {blocked ? (
          <p className="text-center text-sm text-brand-text-muted py-2">{t('msg.blocked')}</p>
        ) : (
          <>
            {err && <p className="text-xs text-red-400 mb-2">{err}</p>}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={keys.ready ? t('msg.placeholder') : t('msg.securing')}
                aria-label={t('msg.placeholder')}
                disabled={!keys.ready}
                className="flex-1 resize-none max-h-36 bg-brand-bg border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:border-brand-red focus:outline-hidden field-sizing-content"
              />
              <button
                onClick={send}
                disabled={!keys.ready || sending || !text.trim()}
                className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-brand-red-light transition-colors"
                aria-label={t('msg.send')}
                title={t('msg.send')}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>

      {showInfo && conv && (
        <ChatInfo
          conversation={conv as any}
          devices={keys.devices}
          onClose={() => setShowInfo(false)}
          onLeft={() => {
            setShowInfo(false);
            onLeft();
          }}
        />
      )}
    </div>
  );
}
