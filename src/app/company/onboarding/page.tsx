'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyAction, useCompanyMutation, useCompanyQuery, useCompanyAuth, useCompanyPath } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '@/lib/i18n';
import {
  Building2,
  Check,
  Clock,
  XCircle,
  Receipt,
  Infinity as InfinityIcon,
  RefreshCw,
  LogOut,
  ChevronDown,
  CreditCard,
  Tag,
  Loader2,
} from 'lucide-react';
import { EyeKeyhole } from '@/components/brand/EyeKeyhole';
import { LanguageToggle } from '@/components/LanguageToggle';
import { friendlyError } from '@/lib/errors';
import { PLANS as PLAN_DATA, UNLIMITED_PRICE, PAYG_FEE, asPlanId, SUPPORT_EMAIL, mailto } from '@/lib/plans';
import { BOOKING_ENABLED } from '@/lib/features';

// Pay as you go needs no checkout; Unlimited goes through Stripe.
const PLANS = [
  {
    id: 'payg' as const,
    icon: Receipt,
    color: PLAN_DATA.payg.color,
    priceMonth: '',
    priceYear: '',
    popular: false,
    features: PLAN_DATA.payg.features,
  },
  {
    id: 'unlimited' as const,
    icon: InfinityIcon,
    color: PLAN_DATA.unlimited.color,
    priceMonth: `€${UNLIMITED_PRICE.monthly}`,
    priceYear: `€${UNLIMITED_PRICE.yearly}`,
    popular: true,
    features: PLAN_DATA.unlimited.features,
  },
];

export default function CompanyOnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { company, logout, refreshCompany } = useCompanyAuth();
  const p = useCompanyPath();
  const companyId = company?.id;

  const companyData = useCompanyQuery(
    api.companies.getById,
    companyId ? { id: companyId as any } : 'skip'
  );

  const acceptTerms = useCompanyMutation(api.companies.acceptTerms);
  const selectPlan = useCompanyMutation(api.companies.selectPlan);
  const createCheckout = useCompanyAction(api.stripe.createCheckoutSession);
  const resubmit = useCompanyMutation(api.companies.resubmitForReview);

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountChecking, setDiscountChecking] = useState(false);
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; plan?: string; period?: string; durationMonths?: number; error?: string } | null>(null);

  // Checked when "Apply" is pressed (server-side rate limited, needs the company session).
  const validateDiscountCode = useCompanyMutation(api.companies.validateDiscountCode);

  const serverStatus = companyData?.onboardingStatus;
  const localStatus = company?.onboardingStatus;

  // Don't downgrade from pending_review to pending_plan in rendered view
  // (race condition: Stripe webhook may not have arrived yet after payment)
  const status =
    localStatus === 'pending_review' && serverStatus === 'pending_plan'
      ? 'pending_review'
      : serverStatus || localStatus;

  // If approved, redirect to dashboard
  useEffect(() => {
    if (status === 'approved') {
      refreshCompany({ onboardingStatus: 'approved' });
      router.replace(p('/company'));
    }
  }, [status, router, refreshCompany, p]);

  // Keep local auth in sync with server data
  useEffect(() => {
    if (companyData && company) {
      if (companyData.onboardingStatus !== company.onboardingStatus) {
        // Don't downgrade from pending_review back to pending_plan
        // (race condition: webhook may not have arrived yet after Stripe payment)
        if (company.onboardingStatus === 'pending_review' && companyData.onboardingStatus === 'pending_plan') {
          return;
        }
        refreshCompany({
          onboardingStatus: companyData.onboardingStatus,
          platformPlan: companyData.platformPlan || undefined,
        });
      }
    }
  }, [companyData, company, refreshCompany]);

  const handleLogout = () => {
    logout();
    router.push(p('/company/login'));
  };

  const handleScroll = useCallback(() => {
    const el = termsRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setScrolledToEnd(true);
    }
  }, []);

 
  // If the terms already fit without scrolling (tall screens), allow accepting right away.
  useEffect(() => {
    const el = termsRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 40) setScrolledToEnd(true);
  });

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
    BOOKING_ENABLED ? t('company.onboarding.step_plan') : t('cx.onboarding.step_confirm'),
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
                    ? 'border-brand-red text-brand-red-light'
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
              className={`text-sm font-semibold hidden sm:inline ${
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
          <EyeKeyhole className="w-6 h-6" />
        </div>
        <span className="text-lg font-display font-bold tracking-wider">
          UN<span className="text-brand-red-light">LOCKED</span>
        </span>
      </div>
      <h1 className="text-lg font-bold hidden sm:block">{title}</h1>
      <div className="flex items-center gap-2">
      <LanguageToggle />
      <button
        onClick={handleLogout}
        className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-brand-text-secondary hover:text-white transition-all"
        title={t('company.nav.logout')}
      >
        <LogOut className="w-4 h-4" />
      </button>
      </div>
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

          <div className="px-4 sm:px-6 pb-40">
            <div
              ref={termsRef}
              onScroll={handleScroll}
              className="bg-brand-surface rounded-2xl border border-white/5 p-5 sm:p-8 max-h-[60vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                {t('company.onboarding.platform_terms_title')}
              </h2>

              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="mb-6">
                  <h3 className="text-brand-red-light font-bold mb-2">
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
          <div className="fixed bottom-0 left-0 right-0 bg-brand-bg/95 backdrop-blur-sm border-t border-white/5 px-6 py-4">
            <div className="max-w-3xl mx-auto">
              {actionError && (
                <p role="alert" className="text-sm text-red-400 text-center mb-3">{actionError}</p>
              )}
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
                  setActionError('');
                  try {
                    await acceptTerms({ companyId: companyId as any });
                    refreshCompany({ onboardingStatus: 'pending_plan' });
                  } catch (err) {
                    setActionError(friendlyError(err, t));
                  } finally {
                    setLoading(false);
                  }
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
    const handleSelectPlan = async (planId: 'payg' | 'unlimited') => {
      setSelectedPlanId(planId);
      setLoading(true);
      setActionError('');
      try {
        // Pay as you go: no checkout, straight to review
        if (planId === 'payg') {
          await selectPlan({ companyId: companyId as any, plan: 'payg' });
          refreshCompany({ onboardingStatus: 'pending_review', platformPlan: 'payg' });
          setLoading(false);
          return;
        }
        const origin = window.location.origin;
        const successUrl = `${origin}${p('/company/onboarding/payment-success')}?plan=${planId}&period=${billingPeriod}`;
        const cancelUrl = `${origin}${p('/company/onboarding')}`;

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
        setActionError(friendlyError(err, t, 'cx.onboarding.checkout_failed'));
        setLoading(false);
        setSelectedPlanId(null);
      }
    };

    // No per-booking plans while UNLOCKED's own booking is off (src/lib/features.ts):
    // no prices here, the company just confirms and goes to review. Packages are
    // agreed with the team directly.
    if (!BOOKING_ENABLED) {
      return (
        <div className="min-h-screen bg-brand-bg">
          <div className="max-w-2xl mx-auto">
            {renderHeader(t('cx.onboarding.confirm_title'))}
            {renderSteps()}
            <div className="px-6 pb-12 text-center">
              <p className="text-brand-text-secondary mb-8">{t('cx.onboarding.confirm_text')}</p>
              {actionError && <p className="text-sm text-red-400 mb-4">{actionError}</p>}
              <button
                onClick={() => handleSelectPlan('payg')}
                disabled={loading}
                className="btn-primary px-10 py-3 inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('cx.onboarding.confirm_button')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-brand-bg">
        <div className="max-w-6xl mx-auto">
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

            {/* Discount Code */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountResult(null);
                    }}
                    placeholder={t('company.onboarding.discount_placeholder')}
                    className="w-full bg-brand-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-hidden"
                  />
                </div>
                <button
                  disabled={!discountCode.trim() || discountChecking || loading}
                  onClick={async () => {
                    setDiscountChecking(true);
                    try {
                      const discountValidation = await validateDiscountCode({ code: discountCode.trim() });
                      if (!discountValidation.valid) {
                        setDiscountResult(discountValidation as any);
                        return;
                      }
                      // Discount codes are free months of Unlimited; the server works out the trial.
                      const plan = 'unlimited' as const;
                      const period = discountValidation.period as 'monthly' | 'yearly';
                      const origin = window.location.origin;
                      const successUrl = `${origin}${p('/company/onboarding/payment-success')}?plan=${plan}&period=${period}`;
                      const cancelUrl = `${origin}${p('/company/onboarding')}`;

                      const checkoutUrl = await createCheckout({
                        companyId: companyId as any,
                        plan,
                        period,
                        successUrl,
                        cancelUrl,
                        discountCode: discountCode.trim(),
                      });

                      window.location.href = checkoutUrl;
                    } catch (err: any) {
                      setDiscountResult({ valid: false, error: friendlyError(err, t, 'cx.onboarding.checkout_failed') });
                    } finally {
                      setDiscountChecking(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-brand-red/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {discountChecking ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('company.onboarding.apply_code')
                  )}
                </button>
              </div>
              {discountResult && !discountResult.valid && (
                <p className="text-xs text-red-400 mt-2">
                  {(() => {
                    const key = `company.onboarding.discount_${discountResult.error}`;
                    const tr = t(key);
                    return tr !== key ? tr : discountResult.error || t('company.onboarding.discount_invalid_code');
                  })()}
                </p>
              )}
              {discountResult && discountResult.valid && (
                <p className="text-xs text-emerald-400 mt-2">
                  {t('company.onboarding.discount_applied', {
                    plan: t('company.plan.unlimited'),
                    months: String(discountResult.durationMonths || 12),
                  })}
                </p>
              )}
            </div>

            {actionError && (
              <div role="alert" className="max-w-xl mx-auto mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
                {actionError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isLoading = loading && selectedPlanId === plan.id;
                const isFree = plan.id === 'payg';
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
                      {t(`company.plan.${plan.id}`)}
                    </h3>

                    {isFree ? (
                      <>
                        <p className="text-3xl font-bold text-white mt-2">
                          €{PAYG_FEE}
                          <span className="text-sm font-normal text-brand-text-secondary">
                            /{t('plans.per_booking')}
                          </span>
                        </p>
                        <p className="text-sm text-brand-text-secondary mb-2">
                          {t('plans.payg_f_cap')}
                        </p>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}

                    <div className="w-4/5 h-px bg-white/10 my-4" />

                    <ul className="w-full space-y-3 mb-6">
                      {plan.features.map((fKey) => (
                        <li
                          key={fKey}
                          className="flex items-center gap-2 text-sm text-brand-text-secondary"
                        >
                          <Check
                            className="w-4 h-4 shrink-0"
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
                      ) : isFree ? (
                        <>
                          <Receipt className="w-4 h-4" />
                          {t('plans.start_payg')}
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          {t('company.onboarding.subscribe')} {t(`company.plan.${plan.id}`)}
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
            <div className="w-full bg-brand-surface rounded-2xl border border-red-500/20 p-6 sm:p-10 text-center">
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

              {actionError && <p role="alert" className="text-sm text-red-400 mb-4">{actionError}</p>}
              <button
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setActionError('');
                  try {
                    await resubmit({ companyId: companyId as any });
                    refreshCompany({ onboardingStatus: 'pending_review' });
                  } catch (err) {
                    setActionError(friendlyError(err, t));
                  } finally {
                    setLoading(false);
                  }
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
            <div className="w-full bg-brand-surface rounded-2xl border border-white/5 p-6 sm:p-10 text-center">
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
                  <Check className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_terms')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_plan').replace(
                      '{{plan}}',
                      t(
                        `company.plan.${asPlanId(companyData?.platformPlan)}`
                      )
                    )}
                  </span>
                </div>
                {companyData?.platformPlan === 'unlimited' && (
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <span className="text-sm text-brand-text-secondary">
                      {t('company.onboarding.check_payment')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-sm text-brand-text-secondary">
                    {t('company.onboarding.check_review')}
                  </span>
                </div>
              </div>

              <div className="mt-8 text-left bg-brand-bg/60 rounded-xl border border-white/5 p-4 max-w-md mx-auto">
                <p className="text-sm font-semibold mb-2">{t('cx.onboarding.next_title')}</p>
                <ul className="space-y-1.5 text-sm text-brand-text-secondary list-disc pl-5">
                  <li>{t('cx.onboarding.next_1')}</li>
                  <li>{t('cx.onboarding.next_2')}</li>
                  <li>{t('cx.onboarding.next_3')}</li>
                </ul>
                <a
                  href={mailto(t('cx.onboarding.question_subject', { company: company?.name || '' }))}
                  className="inline-block mt-3 text-sm text-brand-red-light hover:underline"
                >
                  {t('cx.onboarding.questions', { email: SUPPORT_EMAIL })}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
