'use client';

import { Rocket, Diamond, Crown } from 'lucide-react';

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  starter: {
    label: 'Starter',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    Icon: Rocket,
  },
  pro: {
    label: 'Pro',
    color: 'text-brand-red',
    bg: 'bg-brand-red/10',
    border: 'border-brand-red/20',
    Icon: Diamond,
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    Icon: Crown,
  },
};

export function PlanBadge({
  plan,
  size = 'sm',
  className = '',
}: {
  plan: string;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const config = PLAN_CONFIG[plan];
  if (!config) return null;
  const { label, color, bg, border, Icon } = config;

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-2 ${bg} ${border} border rounded-xl px-4 py-2 ${className}`}>
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`text-sm font-bold ${color}`}>{label}</span>
        <span className="text-xs text-brand-text-secondary font-medium">Plan</span>
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
