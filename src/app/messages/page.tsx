'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from 'convex/react';
import { Lock, MessageCircle } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import { useChatDevice } from '@/lib/useChat';
import { ConversationList } from '@/components/chat/ConversationList';
import { ConversationView } from '@/components/chat/ConversationView';
import { NewChatDialog } from '@/components/chat/NewChatDialog';

/**
 * End-to-end encrypted messages: direct chats with friends and groups.
 * /messages?c=<conversationId> opens a chat; /messages?to=<userId> opens
 * (or starts) the direct chat with that friend.
 */
export default function MessagesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Messages />
    </Suspense>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
    </div>
  );
}

function Messages() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { identity, error } = useChatDevice();
  const startDirect = useMutation(api.messages.startDirect);
  const [newMode, setNewMode] = useState<'direct' | 'group' | null>(null);
  const [startErr, setStartErr] = useState('');
  const startedFor = useRef('');

  const active = params.get('c');
  const to = params.get('to');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // ?to=<userId>: open the direct chat with that friend.
  useEffect(() => {
    if (!to || !user?.sessionToken || startedFor.current === to) return;
    startedFor.current = to;
    startDirect({ sessionToken: user.sessionToken, userId: to as any })
      .then((id) => router.replace(`/messages?c=${id}`))
      .catch((e) => setStartErr(cleanError(e)));
  }, [to, user?.sessionToken, startDirect, router]);

  const open = (id: string) => router.push(`/messages?c=${id}`);

  if (!isAuthenticated || !user) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-0 sm:pb-6">
      <div className="h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-8.5rem)] min-h-[420px] grid md:grid-cols-[340px_1fr] sm:panel sm:rounded-2xl overflow-hidden bg-brand-surface/40">
        {error ? (
          <p className="md:col-span-2 p-8 text-center text-sm text-brand-text-secondary self-center">{t('msg.unsupported')}</p>
        ) : !identity ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center gap-3 text-sm text-brand-text-muted">
            <Lock className="w-6 h-6 animate-pulse text-green-400/80" />
            {t('msg.securing')}
          </div>
        ) : (
          <>
            <aside className={`${active ? 'hidden md:flex' : 'flex'} flex-col min-h-0 md:border-r border-brand-border/60`}>
              <ConversationList identity={identity} activeId={active} onOpen={open} onNew={setNewMode} />
            </aside>
            <section className={`${active ? 'flex' : 'hidden md:flex'} flex-col min-h-0`}>
              {active ? (
                <ConversationView
                  key={active}
                  conversationId={active as Id<'conversations'>}
                  identity={identity}
                  onBack={() => router.push('/messages')}
                  onLeft={() => router.replace('/messages')}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-16 h-16 rounded-full border border-brand-border flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-brand-red-light" />
                  </div>
                  <p className="text-brand-text-secondary text-sm">{startErr || t('msg.pick_chat')}</p>
                  <p className="text-xs text-green-400/80 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />{t('msg.e2e_long')}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {newMode && (
        <NewChatDialog
          mode={newMode}
          onClose={() => setNewMode(null)}
          onOpen={(id) => {
            setNewMode(null);
            open(id);
          }}
        />
      )}
    </div>
  );
}
