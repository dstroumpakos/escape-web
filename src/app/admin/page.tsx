'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import {
  Shield,
  Building2,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Rocket,
  Diamond,
  Crown,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const pendingCompanies = useQuery(
    api.companies.getPendingReview,
    user?.id ? { userId: user.id as any } : 'skip'
  );

  const allCompanies = useQuery(
    api.companies.getAllCompanies,
    user?.id && activeTab === 'all' ? { userId: user.id as any } : 'skip'
  );

  const approveCompany = useMutation(api.companies.approveCompany);
  const declineCompany = useMutation(api.companies.declineCompany);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-brand-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-brand-text-secondary">
            Please log in with an admin account to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-red" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
            <p className="text-brand-text-secondary text-sm">
              Manage company registrations and approvals
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-brand-surface rounded-xl p-1 border border-white/5 max-w-md">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pending'
                ? 'bg-brand-red text-white'
                : 'text-brand-text-secondary hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-brand-red text-white'
                : 'text-brand-text-secondary hover:text-white'
            }`}
          >
            All Companies
          </button>
        </div>

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {!pendingCompanies ? (
              <div className="text-center py-12 text-brand-text-secondary">
                Loading...
              </div>
            ) : pendingCompanies.length === 0 ? (
              <div className="bg-brand-surface rounded-2xl border border-white/5 p-12 text-center">
                <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h2 className="text-xl font-bold mb-2">All caught up!</h2>
                <p className="text-brand-text-secondary">
                  No companies pending review
                </p>
              </div>
            ) : (
              pendingCompanies.map((company: any) => (
                <CompanyReviewCard
                  key={company._id}
                  company={company}
                  userId={user!.id}
                  onApprove={approveCompany}
                  onDecline={declineCompany}
                />
              ))
            )}
          </div>
        )}

        {/* All Companies Tab */}
        {activeTab === 'all' && (
          <div className="space-y-3">
            {!allCompanies ? (
              <div className="text-center py-12 text-brand-text-secondary">
                Loading...
              </div>
            ) : allCompanies.length === 0 ? (
              <div className="text-center py-12 text-brand-text-secondary">
                No companies registered yet
              </div>
            ) : (
              <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">
                          Company
                        </th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">
                          City
                        </th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">
                          Plan
                        </th>
                        <th className="text-left text-xs text-brand-text-secondary font-medium px-4 py-3">
                          Registered
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCompanies.map((company: any) => (
                        <tr
                          key={company._id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-sm">
                                {company.name}
                              </p>
                              <p className="text-xs text-brand-text-secondary">
                                {company.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-brand-text-secondary">
                            {company.city}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={company.onboardingStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <PlanBadgeInline plan={company.platformPlan} />
                          </td>
                          <td className="px-4 py-3 text-sm text-brand-text-secondary">
                            {company.createdAt
                              ? new Date(company.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyReviewCard({
  company,
  userId,
  onApprove,
  onDecline,
}: {
  company: any;
  userId: string;
  onApprove: any;
  onDecline: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const [declineNotes, setDeclineNotes] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove({ companyId: company._id, userId: userId as any });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineNotes.trim()) return;
    setLoading(true);
    try {
      await onDecline({
        companyId: company._id,
        notes: declineNotes,
        userId: userId as any,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red font-bold text-lg">
            {company.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold">{company.name}</h3>
            <p className="text-sm text-brand-text-secondary">{company.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">
            Pending Review
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-brand-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-brand-text-secondary" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <InfoItem icon={Mail} label="Email" value={company.email} />
            <InfoItem icon={Phone} label="Phone" value={company.phone} />
            <InfoItem icon={MapPin} label="Address" value={`${company.address}, ${company.city}`} />
            <InfoItem
              icon={Building2}
              label="VAT"
              value={company.vatNumber || 'N/A'}
            />
            <InfoItem
              icon={Clock}
              label="Plan"
              value={company.platformPlan ? `${company.platformPlan.charAt(0).toUpperCase()}${company.platformPlan.slice(1)}` : 'Not selected'}
            />
            {company.platformPlan && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-brand-text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-brand-text-secondary">Plan Level</p>
                  <PlanBadgeInline plan={company.platformPlan} />
                </div>
              </div>
            )}
            <InfoItem
              icon={Clock}
              label="Registered"
              value={
                company.createdAt
                  ? new Date(company.createdAt).toLocaleString()
                  : 'Unknown'
              }
            />
          </div>

          {company.description && (
            <div className="mb-6">
              <p className="text-sm text-brand-text-secondary mb-1">
                Description
              </p>
              <p className="text-sm bg-brand-bg rounded-xl p-3 border border-white/5">
                {company.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 font-medium transition-colors"
            >
              <Check className="w-4 h-4" /> Approve
            </button>

            {!showDeclineForm ? (
              <button
                onClick={() => setShowDeclineForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition-colors"
              >
                <X className="w-4 h-4" /> Decline
              </button>
            ) : (
              <div className="flex-1 space-y-2">
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Reason for declining..."
                  rows={2}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDecline}
                    disabled={loading || !declineNotes.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Confirm Decline
                  </button>
                  <button
                    onClick={() => {
                      setShowDeclineForm(false);
                      setDeclineNotes('');
                    }}
                    className="text-sm text-brand-text-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-brand-text-secondary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-brand-text-secondary">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Approved' },
    pending_review: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Pending' },
    pending_terms: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Terms' },
    pending_plan: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Plan' },
    declined: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Declined' },
  };
  const c = config[status] || config.approved;
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PlanBadgeInline({ plan }: { plan?: string }) {
  const config: Record<string, { bg: string; text: string; label: string; Icon: any }> = {
    starter: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Starter', Icon: Rocket },
    pro: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Pro', Icon: Diamond },
    enterprise: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Enterprise', Icon: Crown },
  };
  if (!plan || !config[plan]) {
    return <span className="text-xs text-brand-text-secondary">—</span>;
  }
  const c = config[plan];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${c.bg} ${c.text}`}>
      <c.Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}
