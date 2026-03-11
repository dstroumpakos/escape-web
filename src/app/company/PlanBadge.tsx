'use client';

import { Rocket, Diamond, Crown, Gift } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function PlanBadge({
  plan,
  size = 'sm',
  className = '',
}: {
  plan: string;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const { t } = useTranslation();

  const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
    free: {
      label: t('company.plan.free'),
      color: 'text-slate-400',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
      Icon: Gift,
    },
    starter: {
      label: t('company.plan.starter'),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      Icon: Rocket,
    },
    pro: {
      label: t('company.plan.pro'),
      color: 'text-brand-red',
      bg: 'bg-brand-red/10',
      border: 'border-brand-red/20',
      Icon: Diamond,
    },
    enterprise: {
      label: t('company.plan.enterprise'),
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      Icon: Crown,
    },
  };

  const config = PLAN_CONFIG[plan];
  if (!config) return null;
  const { label, color, bg, border, Icon } = config;

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-2 ${bg} ${border} border rounded-xl px-4 py-2 ${className}`}>
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`text-sm font-bold ${color}`}>{label}</span>
        <span className="text-xs text-brand-text-secondary font-medium">{t('company.plan.plan_label')}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${bg} ${border} border rounded-lg px-2.5 py-1 ${className}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
    </div>
  );
}
