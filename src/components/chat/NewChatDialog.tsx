'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import { ChatModal } from './ChatUi';
import { FriendPicker } from './FriendPicker';

/** "New message" (pick one friend) or "New group" (name + several friends). */
export function NewChatDialog({
  mode,
  onClose,
  onOpen,
}: {
  mode: 'direct' | 'group';
  onClose: () => void;
  onOpen: (conversationId: string) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const startDirect = useMutation(api.messages.startDirect);
  const createGroup = useMutation(api.messages.createGroup);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const token = user?.sessionToken;
  if (!token) return null;

  const pickDirect = async (friendId: string) => {
    setBusy(true);
    setErr('');
    try {
      onOpen(await startDirect({ sessionToken: token, userId: friendId as any }));
    } catch (e) {
      setErr(cleanError(e));
      setBusy(false);
    }
  };

  const makeGroup = async () => {
    setBusy(true);
    setErr('');
    try {
      onOpen(await createGroup({ sessionToken: token, name, memberIds: [...selected] as any }));
    } catch (e) {
      setErr(cleanError(e));
      setBusy(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <ChatModal title={mode === 'direct' ? t('msg.new_chat') : t('msg.new_group')} onClose={onClose} closeLabel={t('msg.close')}>
      {mode === 'group' && (
        <div className="px-4 pt-4">
          <label htmlFor="group-name" className="block text-sm text-brand-text-muted mb-1.5">{t('msg.group_name')}</label>
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder={t('msg.group_name_placeholder')}
            className="w-full bg-brand-bg border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-red focus:outline-hidden"
          />
        </div>
      )}
      <FriendPicker
        selected={mode === 'group' ? selected : undefined}
        onToggle={mode === 'group' ? toggle : undefined}
        onPick={mode === 'direct' ? (f) => !busy && pickDirect(f._id) : undefined}
      />
      {err && <p className="px-4 pb-2 text-sm text-red-400">{err}</p>}
      {mode === 'group' && (
        <div className="p-4 border-t border-brand-border flex items-center gap-3 sticky bottom-0 bg-brand-surface">
          <span className="text-sm text-brand-text-muted flex-1">{t('msg.selected', { n: String(selected.size) })}</span>
          <button
            onClick={makeGroup}
            disabled={busy || !name.trim() || selected.size === 0}
            className="btn-primary text-sm py-2! px-5! flex items-center gap-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {t('msg.create_group')}
          </button>
        </div>
      )}
      {mode === 'direct' && busy && <Loader2 className="w-5 h-5 animate-spin mx-auto mb-4 text-brand-text-muted" />}
    </ChatModal>
  );
}
