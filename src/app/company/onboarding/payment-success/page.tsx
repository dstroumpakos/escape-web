'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function PaymentSuccessContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { refreshCompany } = useCompanyAuth();
  const [countdown, setCountdown] = useState(5);

  const plan = params.get('plan') || 'starter';
  const period = params.get('period') || 'monthly';

  useEffect(() => {
    // Update local auth to reflect new state
    refreshCompany({
      onboardingStatus: 'pending_review',
      platformPlan: plan as any,
    });

    // Auto-redirect after 5s
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.replace('/company/onboarding');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refreshCompany, plan, router]);

  const planNames: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-brand-surface rounded-2xl border border-white/5 p-10 text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          {t('stripe.payment_success')}
        </h1>

        <p className="text-brand-text-secondary mb-2">
          {t('stripe.subscribed_to')} <span className="font-bold text-white">{planNames[plan]}</span>
        </p>
        <p className="text-sm text-brand-text-secondary mb-8">
          {period === 'monthly' ? t('stripe.billed_monthly') : t('stripe.billed_yearly')}
        </p>

        <div className="bg-brand-bg rounded-xl p-4 border border-white/5 mb-6">
          <p className="text-sm text-brand-text-secondary">
            {t('stripe.application_submitted')}
          </p>
        </div>

        <button
          onClick={() => router.replace('/company/onboarding')}
          className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
        >
          {t('stripe.continue')} <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-brand-text-secondary mt-4">
          {t('stripe.auto_redirect')} {countdown}s
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
