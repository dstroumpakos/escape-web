'use client';

import { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { PlanBadge } from '../PlanBadge';
import {
  CreditCard,
  Calendar,
  DollarSign,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Receipt,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 29, yearly: 290 },
  pro: { monthly: 49, yearly: 490 },
  enterprise: { monthly: 99, yearly: 990 },
};

export default function BillingPage() {
  const { t } = useTranslation();
  const { company, refreshCompany } = useCompanyAuth();
  const companyId = company?.id;

  // Always read fresh data from the database, not cached localStorage
  const companyData = useQuery(
    api.companies.getById,
    companyId ? { id: companyId as any } : 'skip'
  );

  const createPortalSession = useAction(api.stripe.createPortalSession);
  const getSubscriptionDetails = useAction(api.stripe.getSubscriptionDetails);

  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    async function fetchSubscription() {
      try {
        setLoading(true);
        const details = await getSubscriptionDetails({
          companyId: companyId as any,
        });
        if (!cancelled) setSubscription(details);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load subscription details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubscription();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleManageSubscription = async () => {
    if (!companyId) return;
    try {
      setPortalLoading(true);
      const url = await createPortalSession({
        companyId: companyId as any,
        returnUrl: window.location.href,
      });
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  // Use fresh DB data (companyData) with localStorage fallback
  const plan = (companyData as any)?.platformPlan || company?.platformPlan || 'starter';
  const period = (companyData as any)?.billingPeriod || company?.billingPeriod || 'monthly';
  const paymentStatus = (companyData as any)?.stripePaymentStatus || company?.stripePaymentStatus || 'pending';
  const subscribedAt = (companyData as any)?.platformSubscribedAt || company?.platformSubscribedAt;
  const hasStripeCustomer = !!(companyData as any)?.stripeCustomerId || !!company?.stripeCustomerId;

  // Sync fresh DB data back into localStorage session
  useEffect(() => {
    if (companyData) {
      refreshCompany({
        platformPlan: (companyData as any).platformPlan || null,
        billingPeriod: (companyData as any).billingPeriod || null,
        stripePaymentStatus: (companyData as any).stripePaymentStatus || null,
        stripeCustomerId: (companyData as any).stripeCustomerId || null,
        platformSubscribedAt: (companyData as any).platformSubscribedAt || null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyData]);

  const price = PLAN_PRICES[plan]?.[period as 'monthly' | 'yearly'] ?? 0;

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateMs = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: t('billing.status_active'),
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          Icon: CheckCircle,
        };
      case 'cancelled':
        return {
          label: t('billing.status_cancelled'),
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          Icon: XCircle,
        };
      case 'past_due':
        return {
          label: t('billing.status_past_due'),
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          Icon: AlertTriangle,
        };
      default:
        return {
          label: t('billing.status_pending'),
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          Icon: Clock,
        };
    }
  };

  const statusConfig = getStatusConfig(paymentStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              {t('billing.title')}
            </h1>
            <p className="text-brand-text-secondary mt-1">
              {t('billing.subtitle')}
            </p>
          </div>
          <Receipt className="w-8 h-8 text-brand-red" />
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Plan Overview Card */}
        <div className="bg-brand-surface border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-brand-text-secondary mb-2">
                {t('billing.current_plan')}
              </p>
              <PlanBadge plan={plan} size="lg" />
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg} ${statusConfig.border} border`}>
              <statusConfig.Icon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-brand-text-secondary mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t('billing.amount')}
                </span>
              </div>
              <p className="text-2xl font-bold">
                €{subscription?.amount ?? price}
                <span className="text-sm text-brand-text-secondary font-normal ml-1">
                  /{period === 'yearly' ? t('billing.year') : t('billing.month')}
                </span>
              </p>
            </div>

            {/* Billing Period */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-brand-text-secondary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t('billing.billing_period')}
                </span>
              </div>
              <p className="text-lg font-semibold">
                {period === 'yearly' ? t('billing.yearly') : t('billing.monthly')}
              </p>
              {period === 'yearly' && (
                <p className="text-xs text-emerald-400 mt-1">
                  {t('billing.save_17')}
                </p>
              )}
            </div>

            {/* Subscribed Since */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-brand-text-secondary mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {t('billing.member_since')}
                </span>
              </div>
              <p className="text-lg font-semibold">
                {subscribedAt ? formatDateMs(subscribedAt) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Details Card */}
        {subscription && (
          <div className="bg-brand-surface border border-white/5 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-red" />
              {t('billing.subscription_details')}
            </h2>

            <div className="space-y-4">
              {/* Next Billing Date */}
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-brand-text-secondary text-sm">
                  {subscription.cancelAtPeriodEnd
                    ? t('billing.expires_on')
                    : t('billing.next_payment')}
                </span>
                <span className="text-sm font-medium">
                  {subscription.currentPeriodEnd
                    ? formatDate(subscription.currentPeriodEnd)
                    : '—'}
                </span>
              </div>

              {/* Current Period Start */}
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-brand-text-secondary text-sm">
                  {t('billing.current_period_start')}
                </span>
                <span className="text-sm font-medium">
                  {subscription.currentPeriodStart
                    ? formatDate(subscription.currentPeriodStart)
                    : '—'}
                </span>
              </div>

              {/* Subscription ID */}
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-brand-text-secondary text-sm">
                  {t('billing.subscription_id')}
                </span>
                <span className="text-xs font-mono text-brand-text-secondary bg-white/5 px-2 py-1 rounded">
                  {subscription.id}
                </span>
              </div>

              {/* Payment Method */}
              {subscription.defaultPaymentMethod && (
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-brand-text-secondary text-sm">
                    {t('billing.payment_method')}
                  </span>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-text-secondary" />
                    <span className="text-sm font-medium capitalize">
                      {subscription.defaultPaymentMethod.brand} •••• {subscription.defaultPaymentMethod.last4}
                    </span>
                  </div>
                </div>
              )}

              {/* Cancellation Notice */}
              {subscription.cancelAtPeriodEnd && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      {t('billing.cancel_notice_title')}
                    </p>
                    <p className="text-xs text-amber-400/70 mt-1">
                      {t('billing.cancel_notice_body')}
                      {subscription.currentPeriodEnd
                        ? ` ${formatDate(subscription.currentPeriodEnd)}.`
                        : '.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-brand-surface border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-red" />
            {t('billing.manage_title')}
          </h2>
          <p className="text-sm text-brand-text-secondary mb-6">
            {t('billing.manage_description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading || !hasStripeCustomer}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-red hover:bg-brand-red/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )}
              {t('billing.manage_subscription')}
            </button>
          </div>

          {!hasStripeCustomer && (
            <p className="text-xs text-brand-text-secondary mt-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('billing.no_stripe_customer')}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-brand-text-secondary">
            <Shield className="w-3.5 h-3.5" />
            {t('billing.stripe_powered')}
          </div>
        </div>
      </div>
    </div>
  );
}
