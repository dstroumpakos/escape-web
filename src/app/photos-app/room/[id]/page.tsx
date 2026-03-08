'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { Loader2 } from 'lucide-react';
import PhotosTool from '@/components/photos/PhotosTool';

export default function RoomPhotosPage() {
  const params = useParams();
  const router = useRouter();
  const { company } = useCompanyAuth();
  const roomId = params.id as string;
  const companyId = company?.id;

  const rooms = useQuery(
    api.companies.getRooms,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const room = rooms?.find((r: any) => r._id === roomId);

  // Loading
  if (!rooms) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  // Room not found or not owned
  if (!room) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-brand-text-muted">Room not found</p>
        <button onClick={() => router.push('/')} className="btn-primary">
          Back to Rooms
        </button>
      </div>
    );
  }

  return <PhotosTool roomId={roomId} roomTitle={room.title} />;
}
