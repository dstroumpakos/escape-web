'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import {
  Unlock,
  Building2,
  Check,
  Clock,
  XCircle,
  Rocket,
  Diamond,
  Briefcase,
  RefreshCw,
  LogOut,
  ChevronDown,
  CreditCard,
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter' as const,
    icon: Rocket,
    color: '#4CAF50',
    priceMonth: '€29',
    priceYear: '€290',
    features: [
      'company.onboarding.starter_f1',
      'company.onboarding.starter_f2',
      'company.onboarding.starter_f3',
    ],
  },
  {
    id: 'pro' as const,
    icon: Diamond,
    color: '#E53E3E',
    priceMonth: '€49',
    priceYear: '€490',
    popular: true,
    features: [
      'company.onboarding.pro_f1',
      'company.onboarding.pro_f2',
      'company.onboarding.pro_f3',
      'company.onboarding.pro_f4',
    ],
  },
  {
    id: 'enterprise' as const,
    icon: Briefcase,
    color: '#7C4DFF',
    priceMonth: '€99',
    priceYear: '€990',
    features: [
      'company.onboarding.ent_f1',
      'company.onboarding.ent_f2',
      'company.onboarding.ent_f3',
      'company.onboarding.ent_f4',
    ],
  },
];

export default function CompanyOnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { company, logout, refreshCompany } = useCompanyAuth();
  const companyId = company?.id;

  const companyData = useQuery(
    api.companies.getById,
    companyId ? { id: companyId as any } : 'skip'
  );

  const acceptTerms = useMutation(api.companies.acceptTerms);
  const selectPlan = useMutation(api.companies.selectPlan);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const resubmit = useMutation(api.companies.resubmitForReview);

  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  const status = companyData?.onboardingStatus || company?.onboardingStatus;

  // If approved, redirect to dashboard
  useEffect(() => {
    if (status === 'approved') {
      refreshCompany({ onboardingStatus: 'approved' });
      router.replace('/company');
    }
  }, [status, router, refreshCompany]);

  // Keep local auth in sync with server data
  useEffect(() => {
    if (companyData && company) {
      if (companyData.onboardingStatus !== company.onboardingStatus) {
        refreshCompany({
          onboardingStatus: companyData.onboardingStatus,
          platformPlan: companyData.platformPlan || undefined,
        });
      }
    }
  }, [companyData, company, refreshCompany]);

  const handleLogout = () => {
    logout();
    router.push('/company/login');
  };

  const handleScroll = useCallback(() => {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setScrolledToEnd(true);
    }
  }, []);

  if (!companyData) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Step indicator ───
  const stepIndex =
    status === 'pending_terms'
      ? 0
      : status === 'pending_plan'
        ? 1
        : 2; // pending_review or declined

  const steps = [
    t('company.onboarding.step_terms'),
    t('company.onboarding.step_plan'),
    t('company.onboarding.step_review'),
  ];

  const renderSteps = () => (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                i < stepIndex
                  ? 'bg-brand-red border-brand-red text-white'
                  : i === stepIndex
                    ? 'border-brand-red text-brand-red'
                    : 'border-white/20 text-brand-text-secondary'
              }`}
            >
              {i < stepIndex ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-sm font-semibold ${
                i <= stepIndex ? 'text-white' : 'text-brand-text-secondary'
              }`}
            >
              {label}
            </span>
          </div>
          {i < 2 && (
            <div
              className={`w-8 h-0.5 mx-3 ${
                i < stepIndex ? 'bg-brand-red' : 'bg-white/10'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ─── Header ───
  const renderHeader = (title: string) => (
    <div className="flex items-center justify-between px-6 pt-6 pb-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
          <Unlock className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-display font-bold tracking-wider">
          UN<span className="text-brand-red">LOCKED</span>
        </span>
      </div>
      <h1 className="text-lg font-bold">{title}</h1>
      <button
        onClick={handleLogout}
        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-brand-text-secondary hover:text-white transition-all"
        title={t('company.nav.logout')}
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );

  // ═══════════════════════════════════════════
  //  STEP 1: Accept Terms
  // ═══════════════════════════════════════════
  if (status === 'pending_terms') {
    return (
      <div className="min-h-screen bg-brand-bg">
        <div className="max-w-3xl mx-auto">
          {renderHeader(t('company.onboarding.terms_title'))}
          {renderSteps()}

          <div className="px-6 pb-32">
            <div
              ref={termsRef}
              onScroll={handleScroll}
              className="bg-brand-surface rounded-2xl border border-white/5 p-8 max-h-[60vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                {t('company.onboarding.platform_terms_title')}
              </h2>

              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="mb-6">
                  <h3 className="text-brand-red font-bold mb-2">
                    {t(`company.onboarding.terms${n}_title`)}
                  </h3>
                  <p className="text-brand-text-secondary text-sm leading-relaxed">
                    {t(`company.onboarding.terms${n}_body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-brand-bg/95 backdrop-blur border-t border-white/5 px-6 py-4">
            <div className="max-w-3xl mx-auto">
              {!scrolledToEnd && (
                <p className="text-xs text-brand-text-secondary text-center mb-3 flex items-center justify-center gap-1">
                  <ChevronDown className="w-3 h-3" />
                  {t('company.onboarding.scroll_to_accept')}
                </p>
              )}
              <button
                disabled={!scrolledToEnd || loading}
                onClick={async () => {
                  setLoading(true);
                  await acceptTerms({ companyId: companyId as any });
                  refreshCompany({ onboardingStatus: 'pending_plan' });
                  setLoading(false);
                }}
                className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                  scrolledToEnd
                    ? 'bg-brand-red hover:bg-brand-red/90'
                    : 'bg-white/10 cursor-not-allowed opacity-40'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('company.onboarding.accept_terms')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  STEP 2: Select Plan
  // ═══════════════════════════════════════════
  if (status === 'pending_plan') {
    const handleSelectPlan = async (planId: 'starter' | 'pro' | 'enterprise') => {
      setSelectedPlanId(planId);
      setLoading(true);
      try {
        const origin = window.location.origin;
        const successUrl = `${origin}/company/onboarding/payment-success?plan=${planId}&period=${billingPeriod}`;
        const cancelUrl = `${origin}/company/onboarding`;

        const checkoutUrl = await createCheckout({
          companyId: companyId as any,
          plan: planId,
          period: billingPeriod,
          successUrl,
          cancelUrl,
        });

        window.location.href = checkoutUrl;
      } catch (err: any) {
        console.error('Stripe checkout error:', err);
        setLoading(false);
        setSelectedPlanId(null);
      }
    };

    return (
      <div className="min-h-screen bg-brand-bg">
        <div className="max-w-5xl mx-auto">
          {renderHeader(t('company.onboarding.choose_plan'))}
          {renderSteps()}

          <div className="px-6 pb-12">
            <p className="text-brand-text-secondary text-center mb-6">
              {t('company.onboarding.choose_plan_subtitle')}
            </p>

            {/* Billing period toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-brand-red text-white'
                    : 'bg-white/5 text-brand-text-secondary hover:text-white border border-white/10'
                }`}
              >
                {t('company.onboarding.monthly')}
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-brand-red text-white'
                    : 'bg-white/5 text-brand-text-secondary hover:text-white border border-white/10'
                }`}
              >
                {t('company.onboarding.yearly')}
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  {t('company.onboarding.save_17')}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isLoading = loading && selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-brand-surface rounded-2xl border p-8 flex flex-col items-center transition-all hover:scale-[1.02] ${
                      plan.popular
                        ? 'border-brand-red ring-1 ring-brand-red/20'
                        : 'border-white/5'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 text-xs bg-brand-red text-white px-4 py-1 rounded-full font-bold tracking-wider">
                        {t('company.onboarding.most_popular')}
                      </span>
                    )}

                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-4 mt-1"
                      style={{ backgroundColor: plan.color + '20' }}
                    >
                      <Icon className="w-7 h-7" style={{ color: plan.color }} />
                    </div>

                    <h3 className="text-xl font-bold text-white">
                      {t(`company.onboarding.plan_${plan.id}`)}
                    </h3>

                    <p className="text-3xl font-bold text-white mt-2">
                      {billingPeriod === 'monthly' ? plan.priceMonth : plan.priceYear}
                      <span className="text-sm font-normal text-brand-text-secondary">
                        /{billingPeriod === 'monthly' ? t('company.onboarding.month') : t('company.onboarding.year')}
                      </span>
                    </p>
                    {billingPeriod === 'yearly' && (
                      <p className="text-sm text-emerald-400 mb-2 font-medium">
                        {t('company.onboarding.yearly_savings')}
                      </p>
                    )}
                    {billingPeriod === 'monthly' && (
                      <p className="text-sm text-brand-text-secondary mb-2">
                        {plan.priceYear}/{t('company.onboarding.year')}
                      </p>
                    )}

                    <div className="w-4/5 h-px bg-white/10 my-4" />

                    <ul className="w-full space-y-3 mb-6">
                      {plan.features.map((fKey) => (
                        <li
                          key={fKey}
                          className="flex items-center gap-2 text-sm text-brand-text-secondary"
                        >
                          <Check
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: plan.color }}
                          />
                          {t(fKey)}
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={loading}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        plan.popular
                          ? 'bg-brand-red hover:bg-brand-red/90 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          {t('company.onboarding.subscribe')} {t(`company.onboarding.plan_${plan.id}`)}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-brand-text-secondary text-center mt-6">
              {t('company.onboarding.stripe_secure')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  STEP 3: Pending Review / Declined
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto">
        {renderHeader(t('company.onboarding.review_title'))}
        {renderSteps()}

        <div className="px-6 flex items-center justify-center mt-8">
          {status === 'declined' ? (
            /* Declined */
            <div className="w-full bg-brand-surface rounded-2xl border border-red-500/20 p-10 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-14 h-14 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {t('company.onboarding.declined')}
              </h2>
              <p className="text-brand-text-secondary mb-6">
                {t('company.onboarding.declined_desc')}
              </p>

              {(companyData as any)?.adminNotes && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-bold text-red-400 mb-2">
                    {t('company.onboarding.admin_notes')}
                  </p>
                  <p className="text-sm text-brand-text-secondary leading-relaxed">
                    {(companyData as any).adminNotes}
                  </p>
                </div>
              )}

              <button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  await resubmit({ companyId: companyId as any });
                  refreshCompany({ onboardingStatus: 'pending_review' });
                  setLoading(false);
                }}
                className="bg-brand-red hover:bg-brand-red/90 text-white px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t('company.onboarding.resubmit')}
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Pending Review */
            <div className="w-full bg-brand-surface rounded-2xl border border-white/5 p-10 text-center">
              <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-14 h-14 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {t('company.onboarding.under_review_title')}
              </h2>
              <p className="text-brand-text-secondary mb-8">
                {t('company.onboarding.under_review_desc')}
              </p>

              <div className="space-y-3 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_terms')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_plan').replace(
                      '{{plan}}',
                      t(
                        `company.onboarding.plan_${companyData?.platformPlan || 'starter'}`
                      )
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_payment')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_review')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
