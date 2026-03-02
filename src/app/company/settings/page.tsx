'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useSearchParams } from 'next/navigation';
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
  Code,
  Copy,
  CheckCircle,
  Smartphone,
  Globe,
  BellRing,
  Wallet,
  Info,
  Camera,
  Upload,
  Loader2,
  Palette,
  Image,
  Layers,
  AlertCircle,
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'early-access' | 'widget' | 'photos'>('profile');

  // Widget copy state
  const [widgetCopied, setWidgetCopied] = useState(false);

  // Photo preset state
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrlMutation = useMutation(api.companies.getUrlMutation);
  const savePreset = useMutation(api.bookingPhotos.savePreset);
  const photoPreset = useQuery(
    api.bookingPhotos.getPreset,
    companyId ? { companyId: companyId as any } : 'skip'
  );
  const [presetForm, setPresetForm] = useState({
    logoPosition: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center',
    brandColor: '#FF1E1E',
    watermarkOpacity: 0.3,
    textTemplate: '',
  });
  const [presetLogoUrl, setPresetLogoUrl] = useState('');
  const [presetLogoStorageId, setPresetLogoStorageId] = useState<any>(null);
  const [presetLogoPreview, setPresetLogoPreview] = useState('');
  const [presetLogoUploading, setPresetLogoUploading] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetMsg, setPresetMsg] = useState('');
  const [presetLoaded, setPresetLoaded] = useState(false);
  const presetLogoRef = useRef<HTMLInputElement>(null);

  // Overlay state
  const [overlayUrl, setOverlayUrl] = useState('');
  const [overlayStorageId, setOverlayStorageId] = useState<any>(null);
  const [overlayPreview, setOverlayPreview] = useState('');
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [useOverlay, setUseOverlay] = useState(false);
  const overlayRef = useRef<HTMLInputElement>(null);

  // Respect ?tab= query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'widget' || tab === 'early-access' || tab === 'profile' || tab === 'photos') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Populate photo preset form
  useEffect(() => {
    if (photoPreset && !presetLoaded) {
      setPresetForm({
        logoPosition: photoPreset.logoPosition || 'bottom-right',
        brandColor: photoPreset.brandColor || '#FF1E1E',
        watermarkOpacity: photoPreset.watermarkOpacity ?? 0.3,
        textTemplate: photoPreset.textTemplate || '',
      });
      if (photoPreset.logoUrl) setPresetLogoUrl(photoPreset.logoUrl);
      if (photoPreset.logoStorageId) setPresetLogoStorageId(photoPreset.logoStorageId);
      if ((photoPreset as any).overlayUrl) setOverlayUrl((photoPreset as any).overlayUrl);
      if ((photoPreset as any).overlayStorageId) setOverlayStorageId((photoPreset as any).overlayStorageId);
      if ((photoPreset as any).useOverlay) setUseOverlay(true);
      setPresetLoaded(true);
    }
  }, [photoPreset, presetLoaded]);

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
          { key: 'photos', label: t('company.settings.tab_photos'), icon: Camera },
          { key: 'widget', label: t('company.settings.tab_widget'), icon: Code },
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

      {/* Widget Tab */}
      {activeTab === 'widget' && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-red/20 via-brand-surface to-brand-surface rounded-2xl border border-brand-red/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/30 rounded-full px-3 py-1 mb-4">
                <Code className="w-3.5 h-3.5 text-brand-red" />
                <span className="text-xs font-semibold text-brand-red uppercase tracking-wide">
                  {t('company.settings.tab_widget')}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-3">
                {t('company.widget.title')}
              </h2>
              <p className="text-brand-text-secondary max-w-xl leading-relaxed">
                {t('company.widget.subtitle')}
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-red" />
              {t('company.widget.how_it_works')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: '1', text: t('company.widget.step1'), icon: Copy },
                { step: '2', text: t('company.widget.step2'), icon: Code },
                { step: '3', text: t('company.widget.step3'), icon: Globe },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-4 bg-brand-bg/50 rounded-xl border border-white/5">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-brand-red/20 flex items-center justify-center text-sm font-bold text-brand-red">
                    {item.step}
                  </div>
                  <p className="text-sm text-brand-text-secondary leading-snug">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Code className="w-5 h-5 text-brand-red" />
                {t('company.widget.embed_code')}
              </h3>
              <button
                onClick={() => {
                  const code = `<!-- UNLOCKED Booking Widget -->\n<div id="booking-widget"></div>\n<script\n  src="https://widget.unlocked.gr/booking-widget.js"\n  data-company-id="${companyId}"\n  defer></script>`;
                  navigator.clipboard.writeText(code);
                  setWidgetCopied(true);
                  setTimeout(() => setWidgetCopied(false), 2500);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  widgetCopied
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20'
                }`}
              >
                {widgetCopied ? (
                  <><CheckCircle className="w-4 h-4" /> {t('company.widget.copied')}</>
                ) : (
                  <><Copy className="w-4 h-4" /> {t('company.widget.copy')}</>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-brand-bg rounded-xl p-5 overflow-x-auto text-sm font-mono text-brand-text-secondary border border-white/5 leading-relaxed">
                <code>{`<!-- UNLOCKED Booking Widget -->\n<div id="booking-widget"></div>\n<script\n  src="https://widget.unlocked.gr/booking-widget.js"\n  data-company-id="${companyId || 'YOUR_COMPANY_ID'}"\n  defer></script>`}</code>
              </pre>
            </div>

            <p className="text-xs text-brand-text-secondary/60 mt-3 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {t('company.widget.preview_note')}
            </p>
          </div>

          {/* Widget Features */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold">{t('company.widget.features_title')}</h3>
            </div>
            <p className="text-sm text-brand-text-secondary mb-6">
              {t('company.widget.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Clock, title: t('company.widget.feature1_title'), desc: t('company.widget.feature1_desc') },
                { icon: Users, title: t('company.widget.feature2_title'), desc: t('company.widget.feature2_desc') },
                { icon: Mail, title: t('company.widget.feature3_title'), desc: t('company.widget.feature3_desc') },
                { icon: Smartphone, title: t('company.widget.feature4_title'), desc: t('company.widget.feature4_desc') },
                { icon: BellRing, title: t('company.widget.feature5_title'), desc: t('company.widget.feature5_desc') },
                { icon: Wallet, title: t('company.widget.feature6_title'), desc: t('company.widget.feature6_desc') },
              ].map((feat, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-brand-bg border border-white/5">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-red/15 flex items-center justify-center">
                    <feat.icon className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-0.5">{feat.title}</p>
                    <p className="text-xs text-brand-text-secondary leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customization note */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-brand-red" />
              <h3 className="text-lg font-bold">{t('company.widget.customization')}</h3>
            </div>
            <p className="text-sm text-brand-text-secondary leading-relaxed">
              {t('company.widget.custom_desc')}
            </p>
            <div className="mt-4 p-3 bg-brand-bg/50 rounded-xl border border-white/5">
              <p className="text-xs text-brand-text-secondary">
                {t('company.widget.need_help')}{' '}
                <a href="mailto:support@unlocked.gr" className="text-brand-red hover:underline">
                  support@unlocked.gr
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-red" />
              {t('company.settings.photos_title')}
            </h2>
            <p className="text-sm text-brand-text-secondary mb-6">
              {t('company.settings.photos_desc')}
            </p>

            {presetMsg && (
              <div className={`rounded-xl p-3 mb-4 text-sm ${
                presetMsg.includes('✓') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {presetMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Branding Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  {t('company.settings.photos_mode')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUseOverlay(false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      !useOverlay
                        ? 'border-brand-red bg-brand-red/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Upload className="w-4 h-4 text-brand-red" />
                      <span className="font-semibold text-sm">{t('company.settings.photos_mode_logo')}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted">{t('company.settings.photos_mode_logo_desc')}</p>
                  </button>
                  <button
                    onClick={() => setUseOverlay(true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      useOverlay
                        ? 'border-brand-red bg-brand-red/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-brand-red" />
                      <span className="font-semibold text-sm">{t('company.settings.photos_mode_overlay')}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted">{t('company.settings.photos_mode_overlay_desc')}</p>
                  </button>
                </div>
              </div>

              {/* ─── OVERLAY MODE ─── */}
              {useOverlay && (
                <div className="space-y-5 bg-brand-bg/50 rounded-xl p-5 border border-white/5">
                  {/* Overlay Upload */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">
                      {t('company.settings.photos_overlay')}
                    </label>
                    <input
                      ref={overlayRef}
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setOverlayPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        setOverlayUploading(true);
                        try {
                          const uploadUrl = await generateUploadUrl();
                          const result = await fetch(uploadUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': file.type },
                            body: file,
                          });
                          const { storageId } = await result.json();
                          const url = await getUrlMutation({ storageId });
                          if (url) {
                            setOverlayUrl(url);
                            setOverlayStorageId(storageId);
                          }
                        } catch {
                          setPresetMsg('Failed to upload overlay');
                        } finally {
                          setOverlayUploading(false);
                        }
                      }}
                    />
                    <div
                      onClick={() => overlayRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-red/40 rounded-xl p-6 text-center transition-all group"
                    >
                      {overlayUploading ? (
                        <Loader2 className="w-10 h-10 text-brand-red animate-spin mx-auto" />
                      ) : (overlayPreview || overlayUrl) ? (
                        <div className="relative w-full max-w-sm mx-auto">
                          <div className="bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23333%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23333%22%2F%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23555%22%2F%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23555%22%2F%3E%3C%2Fsvg%3E')] rounded-xl overflow-hidden aspect-video">
                            <img src={overlayPreview || overlayUrl} alt="Overlay" className="w-full h-full object-contain" />
                          </div>
                          <p className="text-xs text-brand-text-muted mt-2">{t('company.settings.photos_change_overlay')}</p>
                        </div>
                      ) : (
                        <div>
                          <Layers className="w-10 h-10 text-brand-text-secondary group-hover:text-brand-red transition-colors mx-auto mb-2" />
                          <p className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">
                            {t('company.settings.photos_upload_overlay')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overlay Instructions */}
                  <div className="bg-brand-surface rounded-xl p-4 border border-white/5">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-red" />
                      {t('company.settings.photos_overlay_instructions_title')}
                    </h4>
                    <ul className="text-xs text-brand-text-muted space-y-1.5 leading-relaxed">
                      <li>• {t('company.settings.photos_overlay_inst_1')}</li>
                      <li>• {t('company.settings.photos_overlay_inst_2')}</li>
                      <li>• {t('company.settings.photos_overlay_inst_3')}</li>
                      <li>• {t('company.settings.photos_overlay_inst_4')}</li>
                      <li>• {t('company.settings.photos_overlay_inst_5')}</li>
                    </ul>
                  </div>

                  {/* Overlay Opacity */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">
                      {t('company.settings.photos_overlay_opacity')} ({Math.round(presetForm.watermarkOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={presetForm.watermarkOpacity * 100}
                      onChange={(e) => setPresetForm({ ...presetForm, watermarkOpacity: parseInt(e.target.value) / 100 })}
                      className="w-full accent-[#FF1E1E]"
                    />
                  </div>

                  {/* Overlay Preview */}
                  {overlayUrl && (
                    <div>
                      <label className="block text-sm text-brand-text-secondary mb-2">
                        <Eye className="w-4 h-4 inline mr-1" />
                        {t('company.settings.photos_preview')}
                      </label>
                      <div className="relative w-full max-w-md aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20">
                          <Image className="w-16 h-16" />
                        </div>
                        <img
                          src={overlayPreview || overlayUrl}
                          alt="Overlay preview"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ opacity: presetForm.watermarkOpacity }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── LOGO MODE ─── */}
              {!useOverlay && (
                <div className="space-y-5">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm text-brand-text-secondary mb-2">
                  {t('company.settings.photos_logo')}
                </label>
                <input
                  ref={presetLogoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setPresetLogoPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                    setPresetLogoUploading(true);
                    try {
                      const uploadUrl = await generateUploadUrl();
                      const result = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': file.type },
                        body: file,
                      });
                      const { storageId } = await result.json();
                      const url = await getUrlMutation({ storageId });
                      if (url) {
                        setPresetLogoUrl(url);
                        setPresetLogoStorageId(storageId);
                      }
                    } catch {
                      setPresetMsg('Failed to upload logo');
                    } finally {
                      setPresetLogoUploading(false);
                    }
                  }}
                />
                <div
                  onClick={() => presetLogoRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-red/40 rounded-xl p-4 text-center transition-all group inline-flex items-center gap-4"
                >
                  {presetLogoUploading ? (
                    <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                  ) : (presetLogoPreview || presetLogoUrl) ? (
                    <img src={presetLogoPreview || presetLogoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-1" />
                  ) : (
                    <div className="w-16 h-16 bg-brand-bg rounded-lg flex items-center justify-center">
                      <Upload className="w-6 h-6 text-brand-text-secondary group-hover:text-brand-red transition-colors" />
                    </div>
                  )}
                  <span className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">
                    {presetLogoUrl ? t('company.settings.photos_change_logo') : t('company.settings.photos_upload_logo')}
                  </span>
                </div>
              </div>

              {/* Logo Position */}
              <div>
                <label className="block text-sm text-brand-text-secondary mb-2">
                  {t('company.settings.photos_logo_pos')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-center'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPresetForm({ ...presetForm, logoPosition: pos })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        presetForm.logoPosition === pos
                          ? 'border-brand-red bg-brand-red/10 text-brand-red'
                          : 'border-white/10 text-brand-text-secondary hover:border-brand-red/30'
                      }`}
                    >
                      {t(`company.settings.photos_pos_${pos.replace('-', '_')}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Color */}
              <div>
                <label className="block text-sm text-brand-text-secondary mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  {t('company.settings.photos_brand_color')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={presetForm.brandColor}
                    onChange={(e) => setPresetForm({ ...presetForm, brandColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={presetForm.brandColor}
                    onChange={(e) => setPresetForm({ ...presetForm, brandColor: e.target.value })}
                    className="w-28 bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-brand-red focus:outline-none"
                    placeholder="#FF1E1E"
                  />
                </div>
              </div>

              {/* Watermark Opacity */}
              <div>
                <label className="block text-sm text-brand-text-secondary mb-2">
                  {t('company.settings.photos_opacity')} ({Math.round(presetForm.watermarkOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={presetForm.watermarkOpacity * 100}
                  onChange={(e) => setPresetForm({ ...presetForm, watermarkOpacity: parseInt(e.target.value) / 100 })}
                  className="w-full accent-[#FF1E1E]"
                />
              </div>

              {/* Text Template */}
              <div>
                <label className="block text-sm text-brand-text-secondary mb-2">
                  {t('company.settings.photos_text_template')}
                </label>
                <input
                  type="text"
                  value={presetForm.textTemplate}
                  onChange={(e) => setPresetForm({ ...presetForm, textTemplate: e.target.value })}
                  placeholder={t('company.settings.photos_text_placeholder')}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                />
                <p className="text-xs text-brand-text-secondary mt-1">
                  {t('company.settings.photos_text_hint')}
                </p>
              </div>

              {/* Preview */}
              {(presetLogoUrl || presetForm.textTemplate) && (
                <div>
                  <label className="block text-sm text-brand-text-secondary mb-2">
                    <Eye className="w-4 h-4 inline mr-1" />
                    {t('company.settings.photos_preview')}
                  </label>
                  <div className="relative w-full max-w-md h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl overflow-hidden border border-white/10">
                    {/* Simulated photo background */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <Image className="w-16 h-16" />
                    </div>
                    {/* Logo overlay */}
                    {presetLogoUrl && (
                      <img
                        src={presetLogoPreview || presetLogoUrl}
                        alt="Logo"
                        className={`absolute w-12 h-12 object-contain ${
                          presetForm.logoPosition === 'top-left' ? 'top-3 left-3' :
                          presetForm.logoPosition === 'top-right' ? 'top-3 right-3' :
                          presetForm.logoPosition === 'bottom-left' ? 'bottom-3 left-3' :
                          presetForm.logoPosition === 'bottom-right' ? 'bottom-3 right-3' :
                          'bottom-3 left-1/2 -translate-x-1/2'
                        }`}
                        style={{ opacity: presetForm.watermarkOpacity }}
                      />
                    )}
                    {/* Text overlay */}
                    {presetForm.textTemplate && (
                      <>
                        {/* Cinematic gradient fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                        {/* Accent line */}
                        <div
                          className="absolute left-1/2 -translate-x-1/2 bottom-10 w-10 h-0.5 rounded-full"
                          style={{ backgroundColor: presetForm.brandColor }}
                        />
                        {/* Text */}
                        <div
                          className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold uppercase tracking-[0.15em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                          style={{ textShadow: `0 0 12px ${presetForm.brandColor}40` }}
                        >
                          {presetForm.textTemplate.replace('{{room}}', 'Room Name').replace('{{time}}', '45:23').replace('{{date}}', '25/12/2025')}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2">
                <button
                  onClick={async () => {
                    if (!companyId) return;
                    setPresetSaving(true);
                    setPresetMsg('');
                    try {
                      await savePreset({
                        companyId: companyId as any,
                        logoUrl: presetLogoUrl || undefined,
                        logoStorageId: presetLogoStorageId || undefined,
                        logoPosition: presetForm.logoPosition,
                        brandColor: presetForm.brandColor,
                        watermarkOpacity: presetForm.watermarkOpacity,
                        textTemplate: presetForm.textTemplate || undefined,
                        overlayUrl: overlayUrl || undefined,
                        overlayStorageId: overlayStorageId || undefined,
                        useOverlay,
                      });
                      setPresetMsg('✓ ' + t('company.settings.photos_saved'));
                    } catch {
                      setPresetMsg(t('company.settings.photos_save_error'));
                    } finally {
                      setPresetSaving(false);
                    }
                  }}
                  disabled={presetSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {presetSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t('company.settings.photos_save')}
                </button>
              </div>
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
