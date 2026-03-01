'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { convertToWebFormat } from '@/lib/imageUtils';
import {
  ArrowLeft,
  Star,
  DoorOpen,
  Image as ImageIcon,
  Send,
  X,
  Loader2,
  Plus,
} from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mediaFiles, setMediaFiles] = useState<{ preview: string; storageId: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rooms = useQuery(api.rooms.list);
  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);


  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (mediaFiles.length + files.length > 4) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Convert to JPEG for web compatibility (handles HEIC, etc.)
        const webFile = await convertToWebFormat(file);
        // Local preview
        const preview = URL.createObjectURL(webFile);
        // Upload to Convex
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': webFile.type },
          body: webFile,
        });
        const { storageId } = await result.json();
        setMediaFiles((prev) => [...prev, { preview, storageId }]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!text.trim() || !user) return;
    setIsSubmitting(true);
    setError('');
    try {
      await createPost({
        authorType: 'user',
        authorUserId: user.id as any,
        text: text.trim(),
        mediaStorageIds: mediaFiles.map((m) => ({ type: 'image' as const, storageId: m.storageId as any })),
        roomId: selectedRoomId ? (selectedRoomId as any) : undefined,
        rating: rating > 0 ? rating : undefined,
      });
      router.push('/social');
    } catch (err: any) {
      setError(err?.message || t('social.create_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/social"
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('social.create_back')}
        </Link>

        <h1 className="section-heading mb-2">
          {t('social.create_title')} <span className="text-gradient">{t('social.create_title_highlight')}</span>
        </h1>
        <p className="text-brand-text-secondary mb-8">
          {t('social.create_subtitle')}
        </p>

        <div className="card p-6 space-y-6">
          {/* Room selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
              {t('social.create_room_label')}
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="input-field"
            >
              <option value="">{t('social.create_no_room')}</option>
              {rooms?.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {r.title} — {r.location}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
              {t('social.create_rating_label')}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(rating === s ? 0 : s)}
                  className="p-2"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      s <= rating
                        ? 'text-brand-gold fill-brand-gold'
                        : 'text-brand-border hover:text-brand-gold/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
              {t('social.create_experience_label')}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('social.create_placeholder')}
              rows={6}
              className="input-field resize-none"
              required
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
              {t('social.create_photos_label')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div className="flex flex-wrap gap-3">
              {mediaFiles.map((m, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-brand-surface group">
                  <img src={m.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-red/40 flex flex-col items-center justify-center gap-1 text-brand-text-secondary hover:text-brand-red transition-all"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px]">{t('social.create_photos_limit')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            disabled={isSubmitting || !text.trim()}
            onClick={handleSubmit}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('social.create_submit')}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
