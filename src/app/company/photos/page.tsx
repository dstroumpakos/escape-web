'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Image,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from 'lucide-react';

// ── Helper: load an image ──
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
}

// ── Client-side canvas compositing ──
async function applyBranding(
  originalUrl: string,
  preset: {
    logoUrl?: string;
    logoPosition?: string;
    brandColor?: string;
    watermarkOpacity?: number;
    textTemplate?: string;
    overlayUrl?: string;
    useOverlay?: boolean;
  } | null
): Promise<Blob> {
  const img = await loadImage(originalUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Draw original photo
  ctx.drawImage(img, 0, 0);

  // No preset — return original
  if (!preset) {
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
    );
  }

  const opacity = preset.watermarkOpacity ?? 0.7;

  // ─── OVERLAY MODE: full-frame transparent PNG on top ───
  if (preset.useOverlay && preset.overlayUrl) {
    try {
      const overlayImg = await loadImage(preset.overlayUrl);
      ctx.globalAlpha = opacity;
      ctx.drawImage(overlayImg, 0, 0, img.width, img.height);
      ctx.globalAlpha = 1;
    } catch {
      // Overlay failed to load — continue without it
    }
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
    );
  }

  // ─── LOGO MODE: logo + text overlay ───
  if (preset.logoUrl) {
    try {
      const logoImg = await loadImage(preset.logoUrl);
      ctx.globalAlpha = opacity;

      // Logo sizing: max 15% of image width, keep aspect ratio
      const maxLogoW = img.width * 0.15;
      const scale = Math.min(maxLogoW / logoImg.width, 1);
      const logoW = logoImg.width * scale;
      const logoH = logoImg.height * scale;
      const pad = img.width * 0.03;

      let x = pad, y = pad;
      switch (preset.logoPosition) {
        case 'top-right':
          x = img.width - logoW - pad; y = pad; break;
        case 'bottom-left':
          x = pad; y = img.height - logoH - pad; break;
        case 'bottom-right':
          x = img.width - logoW - pad; y = img.height - logoH - pad; break;
        case 'bottom-center':
          x = (img.width - logoW) / 2; y = img.height - logoH - pad; break;
        default: // top-left
          x = pad; y = pad; break;
      }

      ctx.drawImage(logoImg, x, y, logoW, logoH);
      ctx.globalAlpha = 1;
    } catch {
      // Logo failed — continue without it
    }
  }

  // Text overlay (logo mode only)
  if (preset.textTemplate) {
    const pad = img.width * 0.03;
    const fontSize = Math.max(16, img.width * 0.025);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    const textY = img.height - pad;

    const metrics = ctx.measureText(preset.textTemplate);
    const textW = metrics.width + fontSize * 2;
    const textH = fontSize * 1.8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect((img.width - textW) / 2, textY - textH + fontSize * 0.3, textW, textH, fontSize * 0.3);
    ctx.fill();

    ctx.fillStyle = preset.brandColor || '#ffffff';
    ctx.fillText(preset.textTemplate, img.width / 2, textY);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
  );
}

export default function CompanyPhotosPage() {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const companyId = company?.id;

  const completedBookings = useQuery(
    api.bookingPhotos.getCompletedBookings,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  // Fetch the company's photo branding preset
  const photoPreset = useQuery(
    api.bookingPhotos.getPreset,
    companyId ? { companyId: companyId as any } : 'skip'
  );

  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrlMutation = useMutation(api.companies.getUrlMutation);
  const addPhoto = useMutation(api.bookingPhotos.addPhoto);
  const deletePhoto = useMutation(api.bookingPhotos.deletePhoto);
  const markPhotoProcessed = useMutation(api.bookingPhotos.markPhotoProcessed);
  const checkAndNotify = useMutation(api.bookingPhotos.checkAndNotifyBooking);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get photos for expanded booking
  const bookingPhotos = useQuery(
    api.bookingPhotos.getByBooking,
    expandedBooking ? { bookingId: expandedBooking as any } : 'skip'
  );

  const handleUploadPhotos = async (bookingId: string, files: FileList) => {
    if (!companyId || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadTotal(files.length);

    try {
      // Get current photo count for ordering
      const existing = bookingPhotos || [];
      let order = existing.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Convert HEIC if needed
        let uploadFile = file;
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          const { convertToWebFormat } = await import('@/lib/imageUtils');
          uploadFile = await convertToWebFormat(file);
        }

        // Upload to Convex storage
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': uploadFile.type },
          body: uploadFile,
        });
        const { storageId } = await result.json();
        const url = await getUrlMutation({ storageId });

        if (url) {
          await addPhoto({
            bookingId: bookingId as any,
            companyId: companyId as any,
            storageId,
            url,
            order: order + i,
          });
        }

        setUploadProgress(i + 1);
      }

      // Auto-expand the booking to show photos
      setExpandedBooking(bookingId);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadTotal(0);
    }
  };

  const handleProcess = async (bookingId: string) => {
    if (!companyId || !bookingPhotos) return;
    setProcessing(bookingId);
    try {
      const pending = bookingPhotos.filter((p: any) => p.status === 'pending');
      for (const photo of pending) {
        // 1. Apply branding on canvas
        const branded = await applyBranding(photo.originalUrl, photoPreset || null);

        // 2. Upload processed image to Convex storage
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: branded,
        });
        const { storageId } = await result.json();
        const processedUrl = await getUrlMutation({ storageId });

        // 3. Mark photo as processed
        if (processedUrl) {
          await markPhotoProcessed({
            photoId: photo._id,
            companyId: companyId as any,
            processedStorageId: storageId,
            processedUrl,
          });
        }
      }

      // 4. Check if all photos ready → notify player
      await checkAndNotify({ bookingId: bookingId as any, companyId: companyId as any });
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!companyId) return;
    if (!confirm(t('company.photos.confirm_delete'))) return;
    try {
      await deletePhoto({ photoId: photoId as any, companyId: companyId as any });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-brand-text-muted" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Camera className="w-7 h-7 text-brand-red" />
            {t('company.photos.title')}
          </h1>
          <p className="text-brand-text-secondary text-sm mt-1">
            {t('company.photos.subtitle')}
          </p>
        </div>
      </div>

      {/* Completed Bookings List */}
      {!completedBookings ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin mx-auto mb-4" />
          <p className="text-brand-text-muted">{t('common.loading')}</p>
        </div>
      ) : completedBookings.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface rounded-2xl border border-white/5">
          <Camera className="w-16 h-16 text-brand-border mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('company.photos.no_bookings')}</h3>
          <p className="text-brand-text-muted">
            {t('company.photos.no_bookings_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {completedBookings.map((booking: any) => {
            const isExpanded = expandedBooking === booking._id;
            return (
              <div key={booking._id} className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
                {/* Booking Header */}
                <div
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedBooking(isExpanded ? null : booking._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{booking.room?.title || 'Room'}</h3>
                      {booking.photoCount > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-red/20 text-brand-red">
                          {t('company.photos.photos_count', { count: String(booking.photoCount) })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-brand-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {booking.playerName || t('company.photos.unknown_player')}
                      </span>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBookingId(booking._id);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                    className="btn-primary !py-2 !px-4 flex items-center gap-1.5 text-sm shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('company.photos.upload')}</span>
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-brand-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-brand-text-muted shrink-0" />
                  )}
                </div>

                {/* Expanded: Photo Gallery */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5">
                    {bookingPhotos && bookingPhotos.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                          {bookingPhotos.map((photo: any) => (
                            <div
                              key={photo._id}
                              className="relative group rounded-xl overflow-hidden border border-white/5 aspect-square bg-brand-bg"
                            >
                              <img
                                src={photo.processedUrl || photo.originalUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              {/* Status badge */}
                              <div className="absolute top-2 left-2">
                                {statusIcon(photo.status)}
                              </div>
                              {/* Actions overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setPreviewUrl(photo.processedUrl || photo.originalUrl)}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                                >
                                  <Eye className="w-5 h-5 text-white" />
                                </button>
                                <button
                                  onClick={() => handleDelete(photo._id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
                                >
                                  <Trash2 className="w-5 h-5 text-red-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Process button — only if there are pending photos */}
                        {bookingPhotos.some((p: any) => p.status === 'pending') && (
                          <button
                            onClick={() => handleProcess(booking._id)}
                            disabled={processing === booking._id}
                            className="btn-primary flex items-center gap-2 text-sm"
                          >
                            {processing === booking._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Image className="w-4 h-4" />
                            )}
                            {t('company.photos.process_all')}
                          </button>
                        )}

                        {/* All ready badge */}
                        {bookingPhotos.every((p: any) => p.status === 'ready') && (
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            {t('company.photos.all_ready')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-brand-text-muted">
                        <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t('company.photos.no_photos_yet')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (selectedBookingId && e.target.files) {
            handleUploadPhotos(selectedBookingId, e.target.files);
            setExpandedBooking(selectedBookingId);
          }
          e.target.value = '';
        }}
      />

      {/* Upload progress overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-brand-surface rounded-2xl p-8 text-center border border-white/10 max-w-sm w-full mx-4">
            <Loader2 className="w-10 h-10 text-brand-red animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold mb-1">
              {t('company.photos.uploading', { current: String(uploadProgress), total: String(uploadTotal) })}
            </p>
            <div className="w-full h-2 bg-brand-bg rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-brand-red rounded-full transition-all"
                style={{ width: `${(uploadProgress / uploadTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewUrl}
            alt=""
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
