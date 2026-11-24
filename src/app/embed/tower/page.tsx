'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const TowerGame = dynamic(() => import('@/components/passport/TowerGame').then((m) => m.TowerGame), {
  ssr: false,
  loading: () => <Spinner />,
});

function Spinner() {
  return <div className="fixed inset-0 bg-black flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>;
}

type State = { placed: number; chambers: number[]; pocket: number; busy: boolean; error?: string };

/**
 * The haunted tower for the phone app, shown inside a WebView.
 * The app keeps the login: it sends the passport numbers in, and this page
 * asks the app to place a stamp. No session token ever reaches the page.
 */
export default function TowerEmbedPage() {
  const [s, setS] = useState<State | null>(null);

  const send = useCallback((msg: object) => {
    (window as any).ReactNativeWebView?.postMessage(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data);
        if (m?.type === 'state' && Array.isArray(m.chambers)) {
          setS({ placed: Number(m.placed) || 0, chambers: m.chambers.map(Number), pocket: Number(m.pocket) || 0, busy: !!m.busy, error: m.error || undefined });
        }
      } catch {}
    };
    window.addEventListener('message', onMsg);
    document.addEventListener('message', onMsg as EventListener); // Android WebView
    send({ type: 'ready' });
    return () => {
      window.removeEventListener('message', onMsg);
      document.removeEventListener('message', onMsg as EventListener);
    };
  }, [send]);

  if (!s) return <Spinner />;
  return (
    <div className="fixed inset-0 bg-black">
      <TowerGame
        embedded
        placed={s.placed}
        chambers={s.chambers}
        pocket={s.pocket}
        busy={s.busy}
        onPlace={async () => send({ type: 'place' })}
        onClose={() => send({ type: 'close' })}
        notice={s.error}
      />
    </div>
  );
}
