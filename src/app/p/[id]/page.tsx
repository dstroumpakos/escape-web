'use client';

import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParams } from 'next/navigation';
import {
  Download,
  Camera,
  Trophy,
  XCircle,
  Timer,
  Users,
  Share2,
} from 'lucide-react';

export default function HostedPhotoPage() {
  const params = useParams();
  const photoId = params.id as string;

  const photo = useQuery(
    api.standalonePhotos.getPublicPhoto,
    photoId ? { photoId: photoId as any } : 'skip'
  );
  const trackView = useMutation(api.standalonePhotos.trackView);
  const trackDownload = useMutation(api.standalonePhotos.trackDownload);

  // Track page view on mount
  useEffect(() => {
    if (photoId) {
      trackView({ photoId: photoId as any }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const handleDownload = async () => {
    if (!photo?.processedUrl) return;
    try {
      await trackDownload({ photoId: photoId as any });
      const response = await fetch(photo.processedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escape-photo-${photo.teamName || 'team'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(photo.processedUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: photo?.teamName ? `${photo.teamName}'s Escape Photo` : 'Escape Room Photo',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (!photo) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="animate-pulse text-brand-text-muted">Loading...</div>
      </div>
    );
  }

  const date = new Date(photo.createdAt);
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Photo */}
      <div className="w-full max-w-3xl mx-auto">
        <img
          src={photo.processedUrl}
          alt={photo.teamName || 'Escape Room Photo'}
          className="w-full"
        />
      </div>

      {/* Info card */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Team + result */}
        <div className="bg-brand-surface rounded-2xl border border-white/5 p-5">
          {photo.teamName && (
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-brand-red" />
              <h1 className="text-xl font-bold">{photo.teamName}</h1>
            </div>
          )}

          {photo.escaped !== undefined && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
              photo.escaped
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {photo.escaped ? (
                <>
                  <Trophy className="w-4 h-4" />
                  Escaped{photo.escapeTime ? ` — ${photo.escapeTime}` : ''}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Locked In
                </>
              )}
            </div>
          )}

          {photo.room && (
            <div className="text-sm text-brand-text-secondary mt-3">
              {photo.room.title}
            </div>
          )}

          <div className="text-xs text-brand-text-muted mt-1">{formattedDate}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Photo
          </button>
          <button
            onClick={handleShare}
            className="btn-secondary px-4 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Powered by */}
        <div className="text-center pt-4 border-t border-white/5">
          <a
            href="https://unlocked.gr"
            className="inline-flex items-center gap-2 text-brand-text-muted hover:text-brand-red transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            Powered by <span className="font-bold text-brand-red">UNLOCKED</span>
          </a>
          <p className="text-xs text-brand-text-muted mt-1">
            {photo.company?.name && `Photo by ${photo.company.name}`}
          </p>
        </div>
      </div>
    </div>
  );
}
