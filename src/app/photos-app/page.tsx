'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Plus,
  Loader2,
  DoorOpen,
  Trash2,
  ChevronRight,
  Image,
  Mail,
  Eye,
  Download,
} from 'lucide-react';

export default function PhotosRoomsDashboard() {
  const { company } = useCompanyAuth();
  const router = useRouter();
  const companyId = company?.id;

  const rooms = useQuery(
    api.companies.getRooms,
    companyId ? { companyId: companyId as any } : 'skip'
  );
  const stats = useQuery(
    api.standalonePhotos.getStats,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const createRoom = useMutation(api.standalonePhotos.createSimpleRoom);
  const deleteRoom = useMutation(api.standalonePhotos.deleteSimpleRoom);

  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!companyId || !newRoomName.trim()) return;
    setCreating(true);
    try {
      await createRoom({ companyId: companyId as any, title: newRoomName.trim() });
      setNewRoomName('');
      setShowCreate(false);
    } catch (err) {
      console.error('Create room failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!companyId) return;
    if (!confirm('Delete this room and its settings? Photos will not be deleted.')) return;
    try {
      await deleteRoom({ roomId: roomId as any, companyId: companyId as any });
    } catch (err) {
      console.error('Delete room failed:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Camera className="w-7 h-7 text-brand-red" />
            Your Rooms
          </h1>
          <p className="text-brand-text-secondary text-sm mt-1">
            Select a room to manage its photos and branding
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Room
        </button>
      </div>

      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { icon: Camera, label: 'Photos', value: stats.totalPhotos, accent: 'text-brand-red' },
            { icon: Camera, label: 'Today', value: stats.todayPhotos, accent: 'text-blue-400' },
            { icon: Mail, label: 'Emails Sent', value: stats.totalEmails, accent: 'text-green-400' },
            { icon: Eye, label: 'Page Views', value: stats.totalViews, accent: 'text-purple-400' },
            { icon: Download, label: 'Downloads', value: stats.totalDownloads, accent: 'text-yellow-400' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-surface rounded-xl border border-white/5 p-4 text-center">
              <s.icon className={`w-5 h-5 ${s.accent} mx-auto mb-1`} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-brand-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create room inline form */}
      {showCreate && (
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name (e.g. The Haunted Mansion)"
              className="input-field flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <button
              onClick={handleCreateRoom}
              disabled={creating || !newRoomName.trim()}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewRoomName(''); }}
              className="btn-secondary px-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rooms list */}
      {!rooms ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin mx-auto" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface rounded-2xl border border-white/5">
          <DoorOpen className="w-16 h-16 text-brand-border mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No rooms yet</h3>
          <p className="text-brand-text-muted mb-6">
            Create your first room to start uploading and branding photos
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: any) => (
            <div
              key={room._id}
              onClick={() => router.push(`/room/${room._id}`)}
              className="group bg-brand-surface rounded-2xl border border-white/5 hover:border-brand-red/30 transition-all cursor-pointer overflow-hidden"
            >
              {/* Room image or placeholder */}
              <div className="aspect-[16/9] bg-brand-bg relative flex items-center justify-center">
                {room.image ? (
                  <img src={room.image} alt={room.title} className="w-full h-full object-cover" />
                ) : (
                  <DoorOpen className="w-12 h-12 text-brand-border" />
                )}
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(room._id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Room info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg truncate">{room.title}</h3>
                  <ChevronRight className="w-5 h-5 text-brand-text-muted group-hover:text-brand-red transition-colors shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
