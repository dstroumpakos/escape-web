'use client';

import { useEffect, useState } from 'react';
import { useCompanyMutation, useCompanyQuery, useCompanyAuth, useCompanyPath } from '@/lib/companyAuth';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';
import {
  Plus,
  DoorOpen,
  Users,
  Clock,
  Star,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  Lock,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock3,
} from 'lucide-react';
import { roomLimitFor } from '@/lib/plans';
import { friendlyError } from '@/lib/errors';
import { useToast } from '@/components/company/Toast';
import { useTranslation } from '@/lib/i18n';
import { BOOKING_ENABLED } from '@/lib/features';
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/animations/AnimateIn';


export default function CompanyRoomsPage() {
  const { company } = useCompanyAuth();
  const p = useCompanyPath();
  const { t } = useTranslation();
  const toast = useToast();
  const companyId = company?.id;
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setCreatedId(new URLSearchParams(window.location.search).get('created'));
  }, []);

  const rooms = useCompanyQuery(
    api.companies.getRooms,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const stats = useCompanyQuery(
    api.companies.getDashboardStats,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const updateRoom = useCompanyMutation(api.companies.updateRoom);
  const deleteRoom = useCompanyMutation(api.companies.deleteRoom);

  const plan = (stats as any)?.plan || company?.platformPlan || 'starter';
  const roomLimit = roomLimitFor(plan, (stats as any)?.roomLimit);
  const roomCount = rooms?.length ?? 0;
  // Rooms made in the Photos app only exist for photo branding; keep them out of this list.
  const listRooms = (rooms || []).filter((r: any) => !r.photosOnly);
  const createdRoom = createdId ? listRooms.find((r: any) => r._id === createdId) : null;
  const atLimit = roomCount >= roomLimit;
  const limitLabel = roomLimit === Infinity ? '∞' : roomLimit;

  const handleToggleActive = async (roomId: string, currentActive: boolean, title: string) => {
    setBusyId(roomId);
    try {
      await updateRoom({ roomId: roomId as any, isActive: !currentActive });
      toast({
        kind: 'success',
        message: t(currentActive ? 'cx.rooms.deactivated' : 'cx.rooms.activated', { title }),
      });
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (roomId: string, title: string) => {
    if (!confirm(t('company.rooms.delete_confirm', { title })))
      return;
    setBusyId(roomId);
    try {
      await deleteRoom({ roomId: roomId as any });
      toast({ kind: 'success', message: t('cx.rooms.deleted', { title }) });
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {createdRoom && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{t('cx.rooms.created_title', { title: createdRoom.title })}</p>
            <p className="text-sm text-brand-text-secondary">{t('cx.rooms.created_desc')}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={p(`/company/slots?room=${createdRoom._id}`)} className="btn-primary text-sm flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" /> {t('cx.rooms.created_cta')}
            </Link>
            <button onClick={() => setCreatedId(null)} className="p-2 rounded-lg hover:bg-white/5" aria-label={t('cx.common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <AnimateIn animation="fadeUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('company.rooms.title')}</h1>
          <p className="text-brand-text-secondary mt-1">
            {t('company.rooms.subtitle')}
          </p>
        </div>
        {BOOKING_ENABLED && atLimit ? (
          <Link
            href={p('/company/billing')}
            className="flex items-center gap-2 text-sm text-brand-text-secondary bg-brand-surface border border-white/5 rounded-xl px-4 py-2.5 hover:border-yellow-500/30"
          >
            <Lock className="w-4 h-4 text-yellow-400" />
            <span>{t('company.rooms.limit_reached')}</span>
          </Link>
        ) : (
          <Link
            href={p('/company/rooms/new')}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('company.rooms.add_room')}
          </Link>
        )}
      </div>
      </AnimateIn>

      {/* Room limit bar (plans only exist with UNLOCKED's own booking) */}
      {BOOKING_ENABLED && rooms && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-brand-text-secondary">
              {t('company.rooms.rooms_used_prefix')} <span className="text-white font-semibold">{roomCount}</span> / {limitLabel}
            </span>
            <Link href={p('/company/billing')} className="text-xs text-brand-text-secondary hover:text-white">
              {t(`company.onboarding.plan_${plan}`)} {t('company.plan.label').toLowerCase()}
            </Link>
          </div>
          <div className="h-2 bg-brand-bg rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all ${
                atLimit ? 'bg-yellow-500' : roomCount / roomLimit > 0.7 ? 'bg-yellow-500/80' : 'bg-brand-red'
              }`}
              style={{ width: `${Math.min((roomCount / (roomLimit === Infinity ? Math.max(roomCount, 1) : roomLimit)) * 100, 100)}%` }}
            />
          </div>
          {atLimit && (
            <div className="flex items-center gap-2 mt-2 text-xs text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {t('company.rooms.upgrade_warning', { plan: t(`company.onboarding.plan_${plan}`), limit: String(limitLabel) })}
                {plan !== 'enterprise' && (
                  <Link href={p('/company/billing')} className="underline ml-1">{t('company.rooms.upgrade_hint')}</Link>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {!rooms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-brand-surface border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : listRooms.length === 0 ? (
        <div className="text-center py-16">
          <DoorOpen className="w-16 h-16 mx-auto mb-4 text-brand-text-secondary/30" />
          <h2 className="text-xl font-bold mb-2">{t('company.rooms.no_rooms')}</h2>
          <p className="text-brand-text-secondary mb-6">
            {t('company.rooms.no_rooms_desc')}
          </p>
          <Link href={p('/company/rooms/new')} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" /> {t('company.rooms.create_room')}
          </Link>
        </div>
      ) : (
        <StaggerContainer stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listRooms.map((room: any) => (
            <StaggerItem key={room._id} animation="fadeUp">
            <div
              className={`bg-brand-surface rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 ${
                room.isActive !== false
                  ? 'border-white/5'
                  : 'border-white/5 opacity-60'
              }`}
            >
              {/* Room Image */}
              <div className="relative h-40 bg-brand-bg">
                {room.image ? (
                  <img
                    src={room.image}
                    alt={room.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <DoorOpen className="w-12 h-12 text-brand-text-secondary/30" />
                  </div>
                )}
                {/* Active Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      room.isActive !== false
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {room.isActive !== false ? t('company.rooms.active') : t('company.rooms.inactive')}
                  </span>
                </div>
              </div>

              {/* Room Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{room.title}</h3>
                <p className="text-sm text-brand-text-secondary flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {room.location}
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-brand-text-secondary mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {room.duration}{t('company.rooms.min_suffix')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {room.players || `${room.playersMin}-${room.playersMax}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />{' '}
                    {room.rating?.toFixed(1) || '—'}
                  </span>
                  <span className="font-semibold text-white">
                    €{room.price}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      room.theme === 'Horror'
                        ? 'bg-red-500/10 text-red-400'
                        : room.theme === 'Adventure'
                        ? 'bg-green-500/10 text-green-400'
                        : room.theme === 'Sci-Fi'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-purple-500/10 text-purple-400'
                    }`}
                  >
                    {room.theme}
                  </span>
                  <span className="text-xs text-brand-text-secondary">
                    {t('company.rooms.difficulty')} {'★'.repeat(room.difficulty)}{'☆'.repeat((room.maxDifficulty || 5) - room.difficulty)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() =>
                      handleToggleActive(room._id, room.isActive !== false, room.title)
                    }
                    disabled={busyId === room._id}
                    className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                    title={room.isActive !== false ? t('cx.rooms.deactivate') : t('cx.rooms.activate')}
                    aria-label={room.isActive !== false ? t('cx.rooms.deactivate') : t('cx.rooms.activate')}
                  >
                    {room.isActive !== false ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-brand-text-secondary" />
                    )}
                  </button>

                  <Link
                    href={p(`/company/rooms/${room._id}/edit`)}
                    className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> {t('company.rooms.edit')}
                  </Link>

                  <Link
                    href={p(`/company/slots?room=${room._id}`)}
                    className="flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4" /> {t('company.rooms.slots')}
                  </Link>

                  <button
                    onClick={() => handleDelete(room._id, room.title)}
                    disabled={busyId === room._id}
                    aria-label={t('cx.rooms.delete')}
                    title={t('cx.rooms.delete')}
                    className="ml-auto flex items-center gap-1.5 text-sm px-2.5 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
