'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import {
  Building2,
  Phone,
  MapPin,
  Mail,
  FileText,
  Save,
  Users,
  CreditCard,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Star,
  TrendingUp,
  Bell,
  Shield,
  BadgeCheck,
  ChevronRight,
  Clock,
  Eye,
  Gift,
  BarChart3,
  Rocket,
  Diamond,
  Crown,
  Check,
} from 'lucide-react';
import { PlanBadge } from '../PlanBadge';
import { useTranslation } from '@/lib/i18n';

export default function CompanySettingsPage() {
  const { company, refreshCompany } = useCompanyAuth();
  const { t } = useTranslation();
  const companyId = company?.id;

  const companyData = useQuery(
    api.companies.getById,
    companyId ? { id: companyId as any } : 'skip'
  );

  const updateProfile = useMutation(api.companies.updateProfile);

  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    vatNumber: '',
    description: '',
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Early Access state (reuses subscriptionEnabled field)
  const [earlyAccessEnabled, setEarlyAccessEnabled] = useState(false);
  const [eaLoaded, setEaLoaded] = useState(false);
  const [eaSaving, setEaSaving] = useState(false);
  const [eaMsg, setEaMsg] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'early-access'>('profile');

  // Populate forms
  useEffect(() => {
    if (companyData && !profileLoaded) {
      setProfile({
        name: companyData.name || '',
        phone: (companyData as any).phone || '',
        address: (companyData as any).address || '',
        city: (companyData as any).city || '',
        vatNumber: (companyData as any).vatNumber || '',
        description: (companyData as any).description || '',
      });
      setEarlyAccessEnabled((companyData as any).subscriptionEnabled || false);
      setProfileLoaded(true);
      setEaLoaded(true);
    }
  }, [companyData, profileLoaded]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateProfile({
        id: companyId as any,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        vatNumber: profile.vatNumber || undefined,
        description: profile.description,
      });
      refreshCompany({ name: profile.name });
      setProfileMsg(t('company.settings.profile_success'));
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      setProfileMsg(t('company.settings.profile_error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleEarlyAccess = async () => {
    const newValue = !earlyAccessEnabled;
    setEarlyAccessEnabled(newValue);
    setEaSaving(true);
    setEaMsg('');
    try {
      await updateProfile({
        id: companyId as any,
        subscriptionEnabled: newValue,
      });
      setEaMsg(newValue ? t('company.settings.ea_joined') : t('company.settings.ea_left'));
      setTimeout(() => setEaMsg(''), 3000);
    } catch (err: any) {
      setEarlyAccessEnabled(!newValue); // rollback
      setEaMsg(t('company.settings.ea_error'));
    } finally {
      setEaSaving(false);
    }
  };

  const companyBenefits = [
    {
      icon: BadgeCheck,
      title: t('company.settings.benefit1_title'),
      desc: t('company.settings.benefit1_desc'),
    },
    {
      icon: TrendingUp,
      title: t('company.settings.benefit2_title'),
      desc: t('company.settings.benefit2_desc'),
    },
    {
      icon: Bell,
      title: t('company.settings.benefit3_title'),
      desc: t('company.settings.benefit3_desc'),
    },
    {
      icon: BarChart3,
      title: t('company.settings.benefit4_title'),
      desc: t('company.settings.benefit4_desc'),
    },
    {
      icon: Gift,
      title: t('company.settings.benefit5_title'),
      desc: t('company.settings.benefit5_desc'),
    },
    {
      icon: Star,
      title: t('company.settings.benefit6_title'),
      desc: t('company.settings.benefit6_desc'),
    },
  ];

  // Derive plan from live companyData or from session
  const currentPlan = (companyData as any)?.platformPlan || company?.platformPlan || null;

  const PLAN_DETAILS: Record<string, { label: string; price: string; yearlyPrice: string; color: string; bg: string; border: string; Icon: any; features: string[] }> = {
    starter: {
      label: t('company.plan.starter'),
      price: '€29/mo',
      yearlyPrice: '€290/yr',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      Icon: Rocket,
      features: [t('company.settings.feature_3_rooms'), t('company.settings.feature_basic_analytics'), t('company.settings.feature_email_support'), t('company.settings.feature_unlocked_listing')],
    },
    pro: {
      label: t('company.plan.pro'),
      price: '€59/mo',
      yearlyPrice: '€590/yr',
      color: 'text-brand-red',
      bg: 'bg-brand-red/10',
      border: 'border-brand-red/20',
      Icon: Diamond,
      features: [t('company.settings.feature_10_rooms'), t('company.settings.feature_advanced_analytics'), t('company.settings.feature_priority_support'), t('company.settings.feature_featured_listing'), t('company.settings.feature_push_notifications')],
    },
    enterprise: {
      label: t('company.plan.enterprise'),
      price: '€99/mo',
      yearlyPrice: '€990/yr',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      Icon: Crown,
      features: [t('company.settings.feature_unlimited_rooms'), t('company.settings.feature_full_analytics'), t('company.settings.feature_dedicated_manager'), t('company.settings.feature_custom_branding'), t('company.settings.feature_api_access'), t('company.settings.feature_white_label')],
    },
  };

  // Plan card expand state
  const [planExpanded, setPlanExpanded] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('company.settings.title')}</h1>
      <p className="text-brand-text-secondary mb-6">
        {t('company.settings.subtitle')}
      </p>

      {/* Current Plan Card */}
      {currentPlan && PLAN_DETAILS[currentPlan] && (() => {
        const plan = PLAN_DETAILS[currentPlan];
        const visibleFeatures = planExpanded ? plan.features : plan.features.slice(0, 3);
        const hasMore = plan.features.length > 3;
        return (
          <div className={`${plan.bg} ${plan.border} border rounded-2xl p-5 mb-8 transition-all`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${plan.bg} flex items-center justify-center`}>
                  <plan.Icon className={`w-6 h-6 ${plan.color}`} />
                </div>
                <div>
                  <p className="text-xs text-brand-text-secondary font-medium uppercase tracking-wide mb-0.5">{t('company.settings.current_plan')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${plan.color}`}>{plan.label}</span>
                    <span className="text-sm text-brand-text-secondary">{plan.price}</span>
                    <span className="text-xs text-brand-text-secondary/60">({plan.yearlyPrice})</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {visibleFeatures.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-white/5 rounded-lg px-2 py-1 text-brand-text-secondary">
                    <Check className={`w-3 h-3 ${plan.color}`} /> {f}
                  </span>
                ))}
                {hasMore && (
                  <button
                    onClick={() => setPlanExpanded(!planExpanded)}
                    className={`text-xs font-medium ${plan.color} hover:underline self-center transition-all`}
                  >
                    {planExpanded ? t('company.settings.show_less') : t('company.settings.show_more', { count: String(plan.features.length - 3) })}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-brand-surface rounded-xl p-1 border border-white/5">
        {[
          { key: 'profile', label: t('company.settings.tab_profile'), icon: Building2 },
          { key: 'early-access', label: t('company.settings.tab_early_access'), icon: Zap },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-brand-red text-white'
                : 'text-brand-text-secondary hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
          <h2 className="text-lg font-bold mb-4">{t('company.settings.company_profile')}</h2>

          {profileMsg && (
            <div
              className={`rounded-xl p-3 mb-4 text-sm ${
                profileMsg === t('company.settings.profile_success')
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">
                {t('company.settings.company_name')}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-red focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-red focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.address')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-red focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.city')}</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">
                {t('company.settings.vat')}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                <input
                  type="text"
                  value={profile.vatNumber}
                  onChange={(e) => setProfile({ ...profile, vatNumber: e.target.value })}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:border-brand-red focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-brand-text-secondary mb-1.5">{t('company.settings.description')}</label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                rows={3}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none resize-none"
                required
              />
            </div>

            <div className="pt-2">
              <p className="text-xs text-brand-text-secondary mb-3">
                {t('company.settings.email_readonly', { email: company?.email || '' })}
              </p>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary flex items-center gap-2"
              >
                {profileSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {t('company.settings.save_profile')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Early Access Tab */}
      {activeTab === 'early-access' && (
        <div className="space-y-6">
          {/* Hero card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-red/20 via-brand-surface to-brand-surface rounded-2xl border border-brand-red/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/30 rounded-full px-3 py-1 mb-4">
                <Zap className="w-3.5 h-3.5 text-brand-red" />
                <span className="text-xs font-semibold text-brand-red uppercase tracking-wide">
                  {t('company.settings.partner_program')}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold mb-3">
                {t('company.settings.ea_title')}
              </h2>
              <p className="text-brand-text-secondary max-w-xl mb-6 leading-relaxed">
                {t('company.settings.ea_desc_before')}
                <span className="text-white font-medium">{t('company.settings.ea_desc_highlight')}</span>
                {t('company.settings.ea_desc_after')}
              </p>

              {/* How it works */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Plus, step: '1', text: t('company.settings.ea_step1') },
                  { icon: Eye, step: '2', text: t('company.settings.ea_step2') },
                  { icon: Clock, step: '3', text: t('company.settings.ea_step3') },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 bg-brand-bg/50 rounded-xl border border-white/5">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-brand-red/20 flex items-center justify-center text-xs font-bold text-brand-red">
                      {item.step}
                    </div>
                    <p className="text-sm text-brand-text-secondary leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>

              {eaMsg && (
                <div
                  className={`rounded-xl p-3 mb-4 text-sm ${
                    eaMsg === t('company.settings.ea_joined') || eaMsg === t('company.settings.ea_left')
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {eaMsg}
                </div>
              )}

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${earlyAccessEnabled ? 'bg-brand-red/20' : 'bg-white/5'}`}>
                    <Shield className={`w-5 h-5 ${earlyAccessEnabled ? 'text-brand-red' : 'text-brand-text-secondary'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {earlyAccessEnabled ? t('company.settings.ea_active') : t('company.settings.ea_inactive')}
                    </p>
                    <p className="text-sm text-brand-text-secondary">
                      {earlyAccessEnabled
                        ? t('company.settings.ea_active_desc')
                        : t('company.settings.ea_inactive_desc')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleEarlyAccess}
                  disabled={eaSaving}
                  className="shrink-0"
                >
                  {eaSaving ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : earlyAccessEnabled ? (
                    <ToggleRightIcon className="w-10 h-10 text-brand-red" />
                  ) : (
                    <ToggleLeftIcon className="w-10 h-10 text-brand-text-secondary" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Benefits for your company */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold">{t('company.settings.benefits_title')}</h3>
            </div>
            <p className="text-sm text-brand-text-secondary mb-6">
              {t('company.settings.benefits_subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyBenefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    earlyAccessEnabled
                      ? 'bg-brand-bg border-brand-red/10'
                      : 'bg-brand-bg/50 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                    earlyAccessEnabled ? 'bg-brand-red/15' : 'bg-white/5'
                  }`}>
                    <benefit.icon className={`w-5 h-5 ${earlyAccessEnabled ? 'text-brand-red' : 'text-brand-text-secondary'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-0.5">{benefit.title}</p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!earlyAccessEnabled && (
              <p className="text-center text-sm text-brand-text-secondary mt-6">
                {t('company.settings.enable_ea')}
              </p>
            )}
          </div>

          {/* For players info  */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold">{t('company.settings.premium_title')}</h3>
            </div>
            <p className="text-sm text-brand-text-secondary mb-4">
              {t('company.settings.premium_subtitle')}
            </p>
            <div className="space-y-2">
              {[
                t('company.settings.perk1'),
                t('company.settings.perk2'),
                t('company.settings.perk3'),
                t('company.settings.perk4'),
              ].map((perk, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-red/15 flex items-center justify-center shrink-0">
                    <ChevronRight className="w-3 h-3 text-brand-red" />
                  </div>
                  <span className="text-brand-text-secondary">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="6" />
      <circle cx="16" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function ToggleLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="6" />
      <circle cx="8" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
