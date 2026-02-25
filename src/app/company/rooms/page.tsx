'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
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
} from 'lucide-react';

const PLAN_ROOM_LIMITS: Record<string, number> = { starter: 3, pro: 10, enterprise: Infinity };

export default function CompanyRoomsPage() {
  const { company } = useCompanyAuth();
  const companyId = company?.id;

  const rooms = useQuery(
    api.companies.getRooms,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const stats = useQuery(
    api.companies.getDashboardStats,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const updateRoom = useMutation(api.companies.updateRoom);
  const deleteRoom = useMutation(api.companies.deleteRoom);

  const plan = (stats as any)?.plan || company?.platformPlan || 'starter';
  const roomLimit = PLAN_ROOM_LIMITS[plan] || 3;
  const roomCount = rooms?.length ?? 0;
  const atLimit = roomCount >= roomLimit;
  const limitLabel = roomLimit === Infinity ? '∞' : roomLimit;

  const handleToggleActive = async (roomId: string, currentActive: boolean) => {
    await updateRoom({ roomId: roomId as any, isActive: !currentActive });
  };

  const handleDelete = async (roomId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This will also remove all time slots. This cannot be undone.`))
      return;
    await deleteRoom({ roomId: roomId as any });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rooms</h1>
          <p className="text-brand-text-secondary mt-1">
            Manage your escape room listings
          </p>
        </div>
        {atLimit ? (
          <div className="flex items-center gap-2 text-sm text-brand-text-secondary bg-brand-surface border border-white/5 rounded-xl px-4 py-2.5">
            <Lock className="w-4 h-4 text-yellow-400" />
            <span>Limit reached</span>
          </div>
        ) : (
          <Link
            href="/company/rooms/new"
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Room
          </Link>
        )}
      </div>

      {/* Room limit bar */}
      {rooms && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-brand-text-secondary">
              Rooms used: <span className="text-white font-semibold">{roomCount}</span> / {limitLabel}
            </span>
            <span className="text-xs text-brand-text-secondary capitalize">{plan} plan</span>
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
                You&apos;ve reached your {plan} plan limit of {limitLabel} rooms.
                {plan !== 'enterprise' && ' Upgrade your plan to add more.'}
              </span>
            </div>
          )}
        </div>
      )}

      {!rooms ? (
        <div className="text-center py-16 text-brand-text-secondary">
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <DoorOpen className="w-16 h-16 mx-auto mb-4 text-brand-text-secondary/30" />
          <h2 className="text-xl font-bold mb-2">No rooms yet</h2>
          <p className="text-brand-text-secondary mb-6">
            Create your first escape room to start accepting bookings
          </p>
          <Link href="/company/rooms/new" className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" /> Create Room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rooms.map((room: any) => (
            <div
              key={room._id}
              className={`bg-brand-surface rounded-2xl border overflow-hidden transition-all ${
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
                    {room.isActive !== false ? 'Active' : 'Inactive'}
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
                    <Clock className="w-3.5 h-3.5" /> {room.duration}min
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
                    Difficulty: {'★'.repeat(room.difficulty)}{'☆'.repeat((room.maxDifficulty || 5) - room.difficulty)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() =>
                      handleToggleActive(room._id, room.isActive !== false)
                    }
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                    title={room.isActive !== false ? 'Deactivate' : 'Activate'}
                  >
                    {room.isActive !== false ? (
                      <ToggleRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-brand-text-secondary" />
                    )}
                  </button>

                  <Link
                    href={`/company/rooms/${room._id}/edit`}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Link>

                  <Link
                    href={`/company/rooms/${room._id}/availability`}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4" /> Slots
                  </Link>

                  <button
                    onClick={() => handleDelete(room._id, room.title)}
                    className="ml-auto flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
