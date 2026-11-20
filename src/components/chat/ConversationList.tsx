'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { MessageSquarePlus, Users } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { decryptMessage, type DeviceIdentity } from '@/lib/chatCrypto';
import { openKey } from '@/lib/useChat';
import { Avatar, formatTime } from './ChatUi';

/** The player's chats, newest first, with decrypted previews. */
export function ConversationList({
  identity,
  activeId,
  onOpen,
  onNew,
}: {
  identity: DeviceIdentity;
  activeId: string | null;
  onOpen: (id: string) => void;
  onNew: (mode: 'direct' | 'group') => void;
}) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const list = useQuery(
    api.messages.listConversations,
    user?.sessionToken ? { sessionToken: user.sessionToken, deviceId: identity.deviceId } : 'skip'
  );
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!list || !user?.id) return;
    let cancelled = false;
    (async () => {
      const out: Record<string, string> = {};
      for (const c of list) {
        const m = c.lastMessage;
        if (!m || m.kind !== 'text' || !c.lastKey || !m.iv || !m.ciphertext || !m.keyVersion) continue;
        const key = await openKey(identity, user.id, c._id, c.lastKey.keyVersion, c.lastKey);
        if (!key) continue;
        try {
          const p = await decryptMessage(key, { iv: m.iv, ciphertext: m.ciphertext }, { conversationId: c._id, keyVersion: m.keyVersion, senderId: m.senderId });
          out[c._id] = (m.senderId === user.id ? `${t('msg.you')}: ` : '') + p.text.replace(/\s+/g, ' ');
        } catch {
          /* shown as "Encrypted message" */
        }
      }
      if (!cancelled) setPreviews(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [list, identity, user?.id, t]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-border/60 shrink-0">
        <h1 className="flex-1 text-xl font-display font-bold text-brand-bone">{t('msg.title')}</h1>
        <button onClick={() => onNew('group')} className="p-2 rounded-lg text-brand-text-muted hover:text-brand-bone hover:bg-white/5" aria-label={t('msg.new_group')} title={t('msg.new_group')}>
          <Users className="w-5 h-5" />
        </button>
        <button onClick={() => onNew('direct')} className="p-2 rounded-lg text-brand-text-muted hover:text-brand-bone hover:bg-white/5" aria-label={t('msg.new_chat')} title={t('msg.new_chat')}>
          <MessageSquarePlus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {list === undefined ? (
          <div className="p-3 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-brand-bg animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-sm text-brand-text-secondary">
            <p>{t('msg.empty_list')}</p>
            <div className="mt-4 flex flex-col gap-2 items-center">
              <button onClick={() => onNew('direct')} className="btn-primary text-sm py-2! px-5!">{t('msg.new_chat')}</button>
              <button onClick={() => onNew('group')} className="btn-ghost text-sm py-2! px-5!">{t('msg.new_group')}</button>
            </div>
          </div>
        ) : (
          <ul>
            {list.map((c) => {
              const active = c._id === activeId;
              const preview = previews[c._id] ?? (c.lastMessage?.kind === 'text' ? t('msg.preview_encrypted') : '');
              return (
                <li key={c._id}>
                  <button
                    onClick={() => onOpen(c._id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-brand-red/10' : 'hover:bg-white/5'}`}
                  >
                    <Avatar src={c.avatar} name={c.name} size={44} group={c.kind === 'group'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`flex-1 truncate ${c.unread ? 'font-bold text-brand-bone' : 'font-medium'}`}>{c.name || t('msg.deleted_user')}</span>
                        <span className="text-[11px] text-brand-text-muted shrink-0">{formatTime(c.lastMessageAt, language)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex-1 truncate text-xs ${c.unread ? 'text-brand-text' : 'text-brand-text-muted'}`}>{preview}</span>
                        {c.unread > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-white text-[11px] font-bold flex items-center justify-center">
                            {c.unread > 99 ? '99+' : c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
