'use client';

import { formatPlayed, shortPlayed } from '@/lib/playTime';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Stamp, BookOpen } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { cleanError } from '@/lib/errors';
import { StampSeal } from '@/components/passport/StampSeal';

/** Where the end-of-game QR leads: take this room's stamp (convex/passport.ts). */
export default function StampPage() {
  const { token } = useParams() as { token: string };
  const { t } = useTranslation();
  const { user } = useAuth();
  const info = useQuery(api.passport.preview, { token, sessionToken: user?.sessionToken });
  const claim = useMutation(api.passport.claim);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ total: number; opened: number | null; already: boolean } | null>(null);

  const take = async () => {
    if (!user) return;
    setBusy(true);
    setErr('');
    try {
      setDone(await claim({ sessionToken: user.sessionToken, token }));
    } catch (e) {
      setErr(cleanError(e));
    } finally {
      setBusy(false);
    }
  };
  const goLogin = () => {
    try {
      sessionStorage.setItem('unlocked_after_login', `/stamp/${token}`);
    } catch {}
  };

  return (
    <section className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-md mx-auto panel p-6 text-center">
        {info === undefined ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto my-10" />
        ) : info === null ? (
          <p className="text-brand-text-secondary py-10">{t('pp.invalid')}</p>
        ) : (
          <>
            <p className="horror-label mb-2">{t('pp.kicker')}</p>
            <h1 className="text-2xl font-display font-bold text-brand-bone">{info.roomTitle}</h1>
            <p className="text-sm text-brand-text-muted mb-6">{info.companyName} · {formatPlayed(info.playedAt, Date.now())}</p>

            <div className="flex justify-center mb-6 min-h-[150px] items-center">
              {done && !done.already ? (
                <StampSeal title={info.roomTitle} theme={info.roomTheme} date={shortPlayed(info.playedAt, Date.now())} escaped={info.escaped} tilt={-8} size={150} slam />
              ) : (
                <div className="w-[150px] h-[150px] rounded-full border-2 border-dashed border-brand-border flex items-center justify-center text-brand-text-muted">
                  <Stamp className="w-10 h-10" />
                </div>
              )}
            </div>

            {done ? (
              <>
                <p className="text-brand-bone font-semibold">{done.already ? t('pp.already') : t('pp.got_it', { n: String(done.total) })}</p>
                {done.opened && <p className="text-brand-gold text-sm mt-1">{t('pp.chamber_opened')}</p>}
                <Link href="/passport" className="btn-primary mt-5 inline-flex items-center gap-2"><BookOpen className="w-4 h-4" /> {t('pp.open_passport')}</Link>
              </>
            ) : info.alreadyHave ? (
              <>
                <p className="text-brand-text-secondary">{t('pp.already')}</p>
                <Link href="/passport" className="btn-outline mt-5 inline-flex items-center gap-2"><BookOpen className="w-4 h-4" /> {t('pp.open_passport')}</Link>
              </>
            ) : info.expired ? (
              <p className="text-brand-text-secondary">{t('pp.expired')}</p>
            ) : info.full ? (
              <p className="text-brand-text-secondary">{t('pp.full')}</p>
            ) : !user ? (
              <>
                <p className="text-brand-text-secondary text-sm mb-4">{t('pp.login_first')}</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/login" onClick={goLogin} className="btn-primary">{t('nav.login')}</Link>
                  <Link href="/signup" onClick={goLogin} className="btn-ghost">{t('nav.signup')}</Link>
                </div>
              </>
            ) : (
              <button onClick={take} disabled={busy} className="btn-primary w-full py-3.5! text-base flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stamp className="w-5 h-5" />} {t('pp.take')}
              </button>
            )}
            {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
          </>
        )}
      </div>
    </section>
  );
}
