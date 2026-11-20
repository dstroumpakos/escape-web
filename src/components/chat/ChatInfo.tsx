'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { Loader2, LogOut, Pencil, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import { securityCode } from '@/lib/chatCrypto';
import { Avatar, ChatModal } from './ChatUi';
import { FriendPicker } from './FriendPicker';

type Member = { _id: string; name: string; avatar: string; role: 'admin' | 'member'; isMe: boolean; deleted: boolean };

/**
 * Members, security codes, and (for group admins) rename / add / remove.
 * Every member can leave a group.
 */
export function ChatInfo({
  conversation,
  devices,
  onClose,
  onLeft,
}: {
  conversation: { _id: string; kind: 'direct' | 'group'; name: string; myRole: 'admin' | 'member'; members: Member[] };
  devices: { userId: string; publicKey: string }[];
  onClose: () => void;
  onLeft: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const token = user?.sessionToken ?? '';
  const rename = useMutation(api.messages.renameGroup);
  const addMembers = useMutation(api.messages.addMembers);
  const removeMember = useMutation(api.messages.removeMember);
  const leave = useMutation(api.messages.leaveGroup);

  const [codes, setCodes] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(conversation.name);
  const [adding, setAdding] = useState(false);
  const [toAdd, setToAdd] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isGroup = conversation.kind === 'group';
  const isAdmin = isGroup && conversation.myRole === 'admin';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const by = new Map<string, string[]>();
      for (const d of devices) by.set(d.userId, [...(by.get(d.userId) ?? []), d.publicKey]);
      const out: Record<string, string> = {};
      for (const [uid, keys] of by) out[uid] = await securityCode(keys);
      if (!cancelled) setCodes(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [devices]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      return true;
    } catch (e) {
      setErr(cleanError(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const cid = conversation._id as any;

  return (
    <ChatModal title={t('msg.info')} onClose={onClose} closeLabel={t('msg.close')}>
      <div className="p-4 space-y-4">
        <p className="flex items-start gap-2 text-xs text-brand-text-secondary bg-brand-bg/60 border border-brand-border/50 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          <span>{t('msg.e2e_long')}</span>
        </p>

        {isGroup && (
          <div>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  aria-label={t('msg.group_name')}
                  className="flex-1 bg-brand-bg border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-red focus:outline-hidden"
                />
                <button
                  disabled={busy || !name.trim()}
                  onClick={async () => (await run(() => rename({ sessionToken: token, conversationId: cid, name }))) && setEditingName(false)}
                  className="btn-primary text-sm py-2! px-4!"
                >
                  {t('msg.save')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h4 className="flex-1 text-lg font-display font-bold text-brand-bone truncate">{conversation.name}</h4>
                {isAdmin && (
                  <button onClick={() => setEditingName(true)} className="text-sm text-brand-text-muted hover:text-brand-bone flex items-center gap-1.5">
                    <Pencil className="w-4 h-4" /> {t('msg.rename')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-brand-text-muted">{t('msg.members', { n: String(conversation.members.length) })}</h4>
            {isAdmin && !adding && (
              <button onClick={() => setAdding(true)} className="text-sm text-brand-red-light flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> {t('msg.add_members')}
              </button>
            )}
          </div>

          {adding ? (
            <div className="border border-brand-border/60 rounded-lg">
              <FriendPicker
                exclude={conversation.members.map((m) => m._id)}
                selected={toAdd}
                onToggle={(id) =>
                  setToAdd((s) => {
                    const n = new Set(s);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                  })
                }
              />
              <div className="flex justify-end gap-2 p-3 border-t border-brand-border/60">
                <button onClick={() => setAdding(false)} className="text-sm text-brand-text-muted px-3">{t('msg.back')}</button>
                <button
                  disabled={busy || toAdd.size === 0}
                  onClick={async () => {
                    if (await run(() => addMembers({ sessionToken: token, conversationId: cid, userIds: [...toAdd] as any }))) {
                      setAdding(false);
                      setToAdd(new Set());
                    }
                  }}
                  className="btn-primary text-sm py-2! px-4! disabled:opacity-50"
                >
                  {t('msg.add')}
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversation.members.map((m) => (
                <li key={m._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                  <Avatar src={m.avatar} name={m.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {m.deleted ? (
                        <span className="text-brand-text-muted">{t('msg.deleted_user')}</span>
                      ) : (
                        <Link href={`/u/${m._id}`} className="font-medium truncate hover:underline">
                          {m.isMe ? `${m.name} (${t('msg.you')})` : m.name}
                        </Link>
                      )}
                      {isGroup && m.role === 'admin' && (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/30">{t('msg.admin')}</span>
                      )}
                    </div>
                    {codes[m._id] && (
                      <p className="text-[11px] font-mono text-brand-text-muted tracking-wider" title={t('msg.security_code')}>
                        {codes[m._id]}
                      </p>
                    )}
                  </div>
                  {isAdmin && !m.isMe && (
                    <button
                      onClick={() => window.confirm(t('msg.remove_confirm', { name: m.name })) && run(() => removeMember({ sessionToken: token, conversationId: cid, userId: m._id as any }))}
                      disabled={busy}
                      className="text-brand-text-muted hover:text-red-400 p-1.5"
                      aria-label={`${t('msg.remove')} ${m.name}`}
                      title={t('msg.remove')}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-xs text-brand-text-muted">
          <p className="font-semibold text-brand-text-secondary mb-1">{t('msg.security_code')}</p>
          <p>{t('msg.security_help')}</p>
        </div>

        {err && <p className="text-sm text-red-400">{err}</p>}

        {isGroup && (
          <button
            onClick={async () => {
              if (!window.confirm(t('msg.leave_confirm'))) return;
              if (await run(() => leave({ sessionToken: token, conversationId: cid }))) onLeft();
            }}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-400 border border-red-900/40 rounded-lg py-2.5 hover:bg-red-900/10"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} {t('msg.leave_group')}
          </button>
        )}
      </div>
    </ChatModal>
  );
}
