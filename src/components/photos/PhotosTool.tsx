'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import {
  Camera,
  Upload,
  Loader2,
  Send,
  Trash2,
  Image,
  Eye,
  X,
  Plus,
  ChevronLeft,
  Mail,
  BarChart3,
  Download,
  CheckCircle,
  Wand2,
  Users,
  Timer,
  Trophy,
  XCircle,
  Settings,
  Palette,
  Type,
  Layers,
  Save,
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

// ═══════════════════════════════════════════════════
// Canvas branding pipeline (reused from existing code)
// ═══════════════════════════════════════════════════
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
  } | null,
  context?: { roomName?: string; teamName?: string; time?: string }
): Promise<Blob> {
  const img = await loadImage(originalUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.drawImage(img, 0, 0);

  if (!preset) {
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
    );
  }

  const opacity = preset.watermarkOpacity ?? 0.7;

  // Overlay mode
  if (preset.useOverlay && preset.overlayUrl) {
    try {
      const overlayImg = await loadImage(preset.overlayUrl);
      ctx.globalAlpha = opacity;
      ctx.drawImage(overlayImg, 0, 0, img.width, img.height);
      ctx.globalAlpha = 1;
    } catch { /* skip */ }
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
    );
  }

  // Logo mode
  if (preset.logoUrl) {
    try {
      const logoImg = await loadImage(preset.logoUrl);
      ctx.globalAlpha = opacity;
      const maxLogoW = img.width * 0.15;
      const scale = Math.min(maxLogoW / logoImg.width, 1);
      const logoW = logoImg.width * scale;
      const logoH = logoImg.height * scale;
      const pad = img.width * 0.03;
      let x = pad, y = pad;
      switch (preset.logoPosition) {
        case 'top-right': x = img.width - logoW - pad; y = pad; break;
        case 'bottom-left': x = pad; y = img.height - logoH - pad; break;
        case 'bottom-right': x = img.width - logoW - pad; y = img.height - logoH - pad; break;
        case 'bottom-center': x = (img.width - logoW) / 2; y = img.height - logoH - pad; break;
        default: x = pad; y = pad; break;
      }
      ctx.drawImage(logoImg, x, y, logoW, logoH);
      ctx.globalAlpha = 1;
    } catch { /* skip */ }
  }

  // Text overlay
  if (preset.textTemplate) {
    let displayText = preset.textTemplate;
    if (context) {
      displayText = displayText
        .replace(/\{\{room\}\}/gi, context.roomName || '')
        .replace(/\{\{team\}\}/gi, context.teamName || '')
        .replace(/\{\{time\}\}/gi, context.time || '');
    }

    const pad = img.width * 0.04;
    const fontSize = Math.max(18, img.width * 0.03);

    const gradientH = img.height * 0.3;
    const grad = ctx.createLinearGradient(0, img.height - gradientH, 0, img.height);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, img.height - gradientH, img.width, gradientH);

    const brandColor = preset.brandColor || '#FF1E1E';
    const lineY = img.height - pad - fontSize * 1.6;
    const lineW = img.width * 0.12;
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = Math.max(2, img.width * 0.002);
    ctx.beginPath();
    ctx.moveTo((img.width - lineW) / 2, lineY);
    ctx.lineTo((img.width + lineW) / 2, lineY);
    ctx.stroke();

    ctx.font = `600 ${fontSize}px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    const textY = img.height - pad;

    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = fontSize * 0.5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayText.toUpperCase(), img.width / 2, textY);

    ctx.shadowColor = brandColor;
    ctx.shadowBlur = fontSize * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(displayText.toUpperCase(), img.width / 2, textY);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
  );
}

// ═══════════════════════════════════════════════════════
// FILTERS — CSS-like canvas filters
// ═══════════════════════════════════════════════════════
type FilterDef = { name: string; label: string; css: string };

const FILTERS: FilterDef[] = [
  { name: 'none', label: 'Original', css: '' },
  { name: 'horror', label: 'Horror', css: 'contrast(1.3) saturate(0.3) brightness(0.8) sepia(0.2)' },
  { name: 'mystery', label: 'Mystery', css: 'contrast(1.1) saturate(0.7) brightness(0.85) hue-rotate(220deg)' },
  { name: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(1.1) brightness(0.95) saturate(0.8)' },
  { name: 'neon', label: 'Neon', css: 'contrast(1.4) saturate(1.8) brightness(1.1)' },
  { name: 'cinematic', label: 'Cinematic', css: 'contrast(1.2) saturate(0.9) brightness(0.9)' },
  { name: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.2)' },
  { name: 'warm', label: 'Warm', css: 'sepia(0.3) saturate(1.2) brightness(1.05)' },
  { name: 'cool', label: 'Cool', css: 'saturate(0.8) brightness(1.05) hue-rotate(15deg)' },
  { name: 'oilpaint', label: 'Oil Paint', css: '__oilpaint__' },
];

// Oil painting color quantization — groups nearby pixels by intensity
function applyOilPaint(canvas: HTMLCanvasElement, radius: number, levels: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const sd = src.data;
  const dd = dst.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rHist = new Int32Array(levels);
      const gHist = new Int32Array(levels);
      const bHist = new Int32Array(levels);
      const count = new Int32Array(levels);
      let maxCount = 0;
      let maxIdx = 0;

      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(h - 1, y + radius);

      for (let ky = y0; ky <= y1; ky++) {
        for (let kx = x0; kx <= x1; kx++) {
          const i = (ky * w + kx) * 4;
          const intensity = ((sd[i] + sd[i + 1] + sd[i + 2]) / 3 * levels / 256) | 0;
          const ci = Math.min(intensity, levels - 1);
          rHist[ci] += sd[i];
          gHist[ci] += sd[i + 1];
          bHist[ci] += sd[i + 2];
          count[ci]++;
          if (count[ci] > maxCount) {
            maxCount = count[ci];
            maxIdx = ci;
          }
        }
      }

      const o = (y * w + x) * 4;
      dd[o] = (rHist[maxIdx] / maxCount) | 0;
      dd[o + 1] = (gHist[maxIdx] / maxCount) | 0;
      dd[o + 2] = (bHist[maxIdx] / maxCount) | 0;
      dd[o + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);
}

// Detect edges and blend darkened outlines into the image for a painted look
function addPaintEdges(canvas: HTMLCanvasElement, strength: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const sd = src.data;

  // Build grayscale for edge detection
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = (sd[i * 4] * 0.299 + sd[i * 4 + 1] * 0.587 + sd[i * 4 + 2] * 0.114);
  }

  // Sobel edge detection
  const edges = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] + gray[idx - w + 1] +
        -2 * gray[idx - 1] + 2 * gray[idx + 1] +
        -gray[idx + w - 1] + gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
        gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Normalize edges
  let maxEdge = 0;
  for (let i = 0; i < edges.length; i++) if (edges[i] > maxEdge) maxEdge = edges[i];
  if (maxEdge === 0) return;

  // Darken pixels along edges — simulates paint outlines between brush strokes
  const out = ctx.createImageData(w, h);
  const od = out.data;
  for (let i = 0; i < w * h; i++) {
    const e = Math.min(1, edges[i] / maxEdge * 2); // amplify edges
    const darken = 1 - e * strength;
    od[i * 4] = (sd[i * 4] * darken) | 0;
    od[i * 4 + 1] = (sd[i * 4 + 1] * darken) | 0;
    od[i * 4 + 2] = (sd[i * 4 + 2] * darken) | 0;
    od[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

// Add canvas-like texture grain
function addCanvasTexture(canvas: HTMLCanvasElement, intensity: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Crosshatch pattern simulating canvas weave
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // Create a crosshatch pattern that varies by position
      const weave = ((x + y) % 4 === 0 || (x - y + 1000) % 5 === 0) ? -intensity : intensity * 0.3;
      d[i] = Math.min(255, Math.max(0, d[i] + weave));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + weave));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + weave));
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

async function applyFilter(imageSrc: string, filterCss: string): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.drawImage(img, 0, 0);

  if (filterCss === '__oilpaint__') {
    // Work on a scaled canvas for performance
    const maxDim = 1000;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const work = document.createElement('canvas');
    work.width = Math.round(canvas.width * scale);
    work.height = Math.round(canvas.height * scale);
    const wctx = work.getContext('2d')!;
    wctx.drawImage(img, 0, 0, work.width, work.height);

    // 1. Gentle color smoothing — radius 2 keeps faces clear
    applyOilPaint(work, 2, 20);

    // 2. Add darkened edges — simulates paint brush stroke boundaries
    addPaintEdges(work, 0.4);

    // 3. Add canvas weave texture
    addCanvasTexture(work, 8);

    // 4. Warm toning + saturation for oil paint color richness
    wctx.filter = 'saturate(1.4) contrast(1.1) sepia(0.15)';
    wctx.drawImage(work, 0, 0);
    wctx.filter = 'none';

    // Scale back to full resolution
    ctx.drawImage(work, 0, 0, canvas.width, canvas.height);
  } else if (filterCss) {
    ctx.filter = filterCss;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92)
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════

type Step = 'gallery' | 'upload' | 'edit' | 'send' | 'settings';

export default function PhotosTool({ roomId, roomTitle }: { roomId: string; roomTitle?: string }) {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const companyId = company?.id;

  // ── Queries (room-scoped) ──
  const photos = useQuery(
    api.standalonePhotos.listByRoom,
    companyId && roomId ? { roomId: roomId as any, companyId: companyId as any } : 'skip'
  );
  const stats = useQuery(
    api.standalonePhotos.getStatsByRoom,
    companyId && roomId ? { roomId: roomId as any, companyId: companyId as any } : 'skip'
  );
  const roomPreset = useQuery(
    api.standalonePhotos.getRoomPreset,
    roomId ? { roomId: roomId as any } : 'skip'
  );
  // Fall back to company preset if no room preset
  const companyPreset = useQuery(
    api.bookingPhotos.getPreset,
    companyId ? { companyId: companyId as any } : 'skip'
  );
  const photoPreset = roomPreset || companyPreset;

  // ── Mutations ──
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrlMutation = useMutation(api.companies.getUrlMutation);
  const createPhoto = useMutation(api.standalonePhotos.create);
  const saveProcessed = useMutation(api.standalonePhotos.saveProcessed);
  const updateMeta = useMutation(api.standalonePhotos.updateMeta);
  const deletePhotoMut = useMutation(api.standalonePhotos.deletePhoto);
  const sendPhotoAction = useAction(api.standalonePhotos.sendPhotoToEmails);
  const saveRoomPresetMut = useMutation(api.standalonePhotos.saveRoomPreset);

  // ── UI State ──
  const [step, setStep] = useState<Step>('gallery');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sending, setSending] = useState(false);

  // Current photo being edited
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [currentOriginalUrl, setCurrentOriginalUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Edit state
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [escaped, setEscaped] = useState<boolean | undefined>(undefined);
  const [escapeTime, setEscapeTime] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [applyBrand, setApplyBrand] = useState(true);

  // Send state
  const [emailAddresses, setEmailAddresses] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  // Preview modal
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  // Settings state
  const [settingsLogoUrl, setSettingsLogoUrl] = useState('');
  const [settingsLogoStorageId, setSettingsLogoStorageId] = useState<string | undefined>();
  const [settingsLogoPosition, setSettingsLogoPosition] = useState<string>('bottom-right');
  const [settingsBrandColor, setSettingsBrandColor] = useState('#FF1E1E');
  const [settingsOpacity, setSettingsOpacity] = useState(0.7);
  const [settingsTextTemplate, setSettingsTextTemplate] = useState('');
  const [settingsOverlayUrl, setSettingsOverlayUrl] = useState('');
  const [settingsOverlayStorageId, setSettingsOverlayStorageId] = useState<string | undefined>();
  const [settingsUseOverlay, setSettingsUseOverlay] = useState(false);
  const [settingsDefaultFilter, setSettingsDefaultFilter] = useState('none');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  // ── Filtered preview generation ──
  const generatePreview = useCallback(async (url: string, filter: string, brand: boolean) => {
    if (!url) return;

    let blob: Blob;

    // Apply filter first
    const filterDef = FILTERS.find((f) => f.name === filter);
    if (filterDef && filterDef.css) {
      blob = await applyFilter(url, filterDef.css);
    } else {
      const response = await fetch(url);
      blob = await response.blob();
    }

    // Apply branding on top
    if (brand && photoPreset) {
      const tempUrl = URL.createObjectURL(blob);
      blob = await applyBranding(tempUrl, photoPreset, {
        roomName: roomTitle,
        teamName,
      });
      URL.revokeObjectURL(tempUrl);
    }

    const prevUrl = URL.createObjectURL(blob);
    setPreviewUrl((old) => {
      if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
      return prevUrl;
    });
  }, [photoPreset, roomTitle, teamName]);

  // Regenerate preview when filter/branding changes
  useEffect(() => {
    if (step === 'edit' && currentOriginalUrl) {
      generatePreview(currentOriginalUrl, selectedFilter, applyBrand);
    }
  }, [step, currentOriginalUrl, selectedFilter, applyBrand, generatePreview]);

  // ═══════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════

  const handleUpload = async (files: FileList) => {
    if (!companyId || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0]; // Single photo workflow
      let uploadFile = file;

      // HEIC conversion
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
        const photoId = await createPhoto({
          companyId: companyId as any,
          roomId: roomId as any,
          originalStorageId: storageId,
          originalUrl: url,
        });

        setCurrentPhotoId(photoId);
        setCurrentOriginalUrl(url);
        setPreviewUrl(url);
        setSelectedFilter(roomPreset?.defaultFilter || 'none');
        setApplyBrand(true);
        setTeamName('');
        setEscaped(undefined);
        setEscapeTime('');
        setSelectedRoom(roomId);
        setEmailAddresses('');
        setSendSuccess(false);
        setStep('edit');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!companyId || !currentPhotoId || !currentOriginalUrl) return;
    setProcessing(true);
    try {
      // Generate final processed image
      let blob: Blob;
      const filterDef = FILTERS.find((f) => f.name === selectedFilter);
      if (filterDef && filterDef.css) {
        blob = await applyFilter(currentOriginalUrl, filterDef.css);
      } else {
        const response = await fetch(currentOriginalUrl);
        blob = await response.blob();
      }

      if (applyBrand && photoPreset) {
        const tempUrl = URL.createObjectURL(blob);
        blob = await applyBranding(tempUrl, photoPreset, {
          roomName: roomTitle,
          teamName,
        });
        URL.revokeObjectURL(tempUrl);
      }

      // Upload processed image
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      const { storageId } = await result.json();
      const processedUrl = await getUrlMutation({ storageId });

      if (processedUrl) {
        await saveProcessed({
          photoId: currentPhotoId as any,
          companyId: companyId as any,
          processedStorageId: storageId,
          processedUrl,
          filter: selectedFilter !== 'none' ? selectedFilter : undefined,
          hasWatermark: applyBrand,
        });

        // Update meta
        await updateMeta({
          photoId: currentPhotoId as any,
          companyId: companyId as any,
          roomId: roomId as any,
          teamName: teamName || undefined,
          escaped,
          escapeTime: escapeTime || undefined,
        });

        setPreviewUrl(processedUrl);
        setStep('send');
      }
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendEmails = async () => {
    if (!companyId || !currentPhotoId) return;
    const emails = emailAddresses
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length === 0) return;
    setSending(true);
    try {
      const photoPageUrl = `${window.location.origin}/p/${currentPhotoId}`;

      await sendPhotoAction({
        photoId: currentPhotoId as any,
        companyId: companyId as any,
        emails,
        photoPageUrl,
      });

      setSendSuccess(true);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!companyId) return;
    try {
      await deletePhotoMut({ photoId: photoId as any, companyId: companyId as any });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const openExistingPhoto = (photo: any) => {
    setCurrentPhotoId(photo._id);
    setCurrentOriginalUrl(photo.originalUrl);
    setPreviewUrl(photo.processedUrl || photo.originalUrl);
    setSelectedRoom(roomId);
    setTeamName(photo.teamName || '');
    setEscaped(photo.escaped);
    setEscapeTime(photo.escapeTime || '');
    setSelectedFilter(photo.filter || 'none');
    setApplyBrand(photo.hasWatermark ?? true);
    setEmailAddresses('');
    setSendSuccess(false);
    setStep(photo.status === 'ready' || photo.status === 'sent' ? 'send' : 'edit');
  };

  const resetToGallery = () => {
    setStep('gallery');
    setCurrentPhotoId(null);
    setCurrentOriginalUrl('');
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setSendSuccess(false);
  };

  // ── Settings helpers ──
  const openSettings = () => {
    // Load existing preset values
    setSettingsLogoUrl(roomPreset?.logoUrl || '');
    setSettingsLogoStorageId(roomPreset?.logoStorageId || undefined);
    setSettingsLogoPosition(roomPreset?.logoPosition || 'bottom-right');
    setSettingsBrandColor(roomPreset?.brandColor || '#FF1E1E');
    setSettingsOpacity(roomPreset?.watermarkOpacity ?? 0.7);
    setSettingsTextTemplate(roomPreset?.textTemplate || '');
    setSettingsOverlayUrl(roomPreset?.overlayUrl || '');
    setSettingsOverlayStorageId(roomPreset?.overlayStorageId || undefined);
    setSettingsUseOverlay(roomPreset?.useOverlay || false);
    setSettingsDefaultFilter(roomPreset?.defaultFilter || 'none');
    setStep('settings');
  };

  const handleUploadLogo = async (files: FileList) => {
    if (!files.length) return;
    setUploadingLogo(true);
    try {
      const file = files[0];
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await getUrlMutation({ storageId });
      if (url) {
        setSettingsLogoStorageId(storageId);
        setSettingsLogoUrl(url);
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadOverlay = async (files: FileList) => {
    if (!files.length) return;
    setUploadingOverlay(true);
    try {
      const file = files[0];
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const url = await getUrlMutation({ storageId });
      if (url) {
        setSettingsOverlayStorageId(storageId);
        setSettingsOverlayUrl(url);
        setSettingsUseOverlay(true);
      }
    } catch (err) {
      console.error('Overlay upload failed:', err);
    } finally {
      setUploadingOverlay(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!companyId) return;
    setSavingSettings(true);
    try {
      await saveRoomPresetMut({
        roomId: roomId as any,
        companyId: companyId as any,
        logoUrl: settingsLogoUrl || undefined,
        logoStorageId: settingsLogoStorageId as any || undefined,
        logoPosition: (settingsLogoPosition as any) || undefined,
        brandColor: settingsBrandColor || undefined,
        watermarkOpacity: settingsOpacity,
        textTemplate: settingsTextTemplate || undefined,
        overlayUrl: settingsOverlayUrl || undefined,
        overlayStorageId: settingsOverlayStorageId as any || undefined,
        useOverlay: settingsUseOverlay,
        defaultFilter: settingsDefaultFilter !== 'none' ? settingsDefaultFilter : undefined,
      });
      setStep('gallery');
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'gallery' ? () => router.push('/') : step === 'settings' ? resetToGallery : resetToGallery}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Camera className="w-7 h-7 text-brand-red" />
              {roomTitle || 'Photos'}
            </h1>
            <p className="text-brand-text-secondary text-sm mt-1">
              {step === 'gallery' && 'Upload, brand, and send team photos in seconds'}
              {step === 'edit' && 'Edit and apply branding'}
              {step === 'send' && 'Send to players'}
              {step === 'settings' && 'Logo, overlay & branding settings for this room'}
            </p>
          </div>
        </div>

        {step === 'gallery' && (
          <div className="flex items-center gap-2">
            <button
              onClick={openSettings}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Photo
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {step === 'gallery' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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

      {/* ═══════════════ GALLERY VIEW ═══════════════ */}
      {step === 'gallery' && (
        <>
          {!photos ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin mx-auto mb-4" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 bg-brand-surface rounded-2xl border border-white/5">
              <Camera className="w-16 h-16 text-brand-border mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
              <p className="text-brand-text-muted mb-6">Upload your first team photo to get started</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo: any) => (
                <div
                  key={photo._id}
                  onClick={() => openExistingPhoto(photo)}
                  className="relative group rounded-xl overflow-hidden border border-white/5 aspect-[4/3] bg-brand-bg cursor-pointer hover:border-brand-red/30 transition-colors"
                >
                  <img
                    src={photo.processedUrl || photo.originalUrl}
                    alt={photo.teamName || ''}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-xs font-medium truncate">{photo.teamName || 'Untitled'}</div>
                    <div className="text-xs text-brand-text-muted">{photo.room?.title || ''}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {photo.status === 'sent' && (
                        <span className="text-xs text-green-400 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Sent ({photo.emailsSent})
                        </span>
                      )}
                      {photo.status === 'ready' && (
                        <span className="text-xs text-blue-400 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {photo.status === 'draft' && (
                        <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                          <Wand2 className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo._id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ EDIT VIEW ═══════════════ */}
      {step === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div>
            <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="aspect-[4/3] relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain bg-black" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-bg">
                    <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Filters strip */}
            <div className="mt-4">
              <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Filters</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFilter(f.name)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedFilter === f.name
                        ? 'bg-brand-red text-white border-brand-red'
                        : 'bg-brand-surface border-white/10 text-brand-text-secondary hover:border-brand-red/30'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-5">
            {/* Team name */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. The Masterminds"
                className="input-field w-full"
              />
            </div>

            {/* Escape result */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Result
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEscaped(escaped === true ? undefined : true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    escaped === true
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-brand-surface border-white/10 text-brand-text-muted hover:border-white/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> Escaped
                </button>
                <button
                  onClick={() => setEscaped(escaped === false ? undefined : false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                    escaped === false
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-brand-surface border-white/10 text-brand-text-muted hover:border-white/20'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Locked In
                </button>
              </div>
            </div>

            {/* Escape time */}
            {escaped === true && (
              <div>
                <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                  <Timer className="w-4 h-4" /> Escape Time
                </label>
                <input
                  type="text"
                  value={escapeTime}
                  onChange={(e) => setEscapeTime(e.target.value)}
                  placeholder="e.g. 45:23"
                  className="input-field w-full"
                />
              </div>
            )}

            {/* Apply branding toggle */}
            <div className="flex items-center justify-between bg-brand-surface rounded-xl border border-white/5 p-4">
              <div>
                <div className="text-sm font-medium">Apply Branding</div>
                <div className="text-xs text-brand-text-muted">Logo, overlay & text from your room preset</div>
              </div>
              <button
                onClick={() => setApplyBrand(!applyBrand)}
                className={`w-12 h-6 rounded-full transition-colors relative ${applyBrand ? 'bg-brand-red' : 'bg-brand-border'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${applyBrand ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={resetToGallery} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={processing}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Process & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ SEND VIEW ═══════════════ */}
      {step === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
            <div className="aspect-[4/3] relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Processed"
                  className="w-full h-full object-contain bg-black cursor-pointer"
                  onClick={() => setModalUrl(previewUrl)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-bg">
                  <Image className="w-12 h-12 text-brand-border" />
                </div>
              )}
            </div>

            {/* Photo info */}
            <div className="p-4 space-y-1">
              {teamName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-brand-text-muted" />
                  <span className="font-medium">{teamName}</span>
                </div>
              )}
              {escaped !== undefined && (
                <div className={`flex items-center gap-2 text-sm ${escaped ? 'text-green-400' : 'text-red-400'}`}>
                  {escaped ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {escaped ? `Escaped${escapeTime ? ` — ${escapeTime}` : ''}` : 'Locked In'}
                </div>
              )}
            </div>
          </div>

          {/* Right: Email form */}
          <div className="space-y-5">
            {sendSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-400 mb-1">Photo Sent!</h3>
                <p className="text-sm text-brand-text-secondary mb-4">
                  Emails have been queued and will arrive in seconds.
                </p>

                {/* Hosted link */}
                <div className="bg-brand-surface rounded-xl p-4 mb-4">
                  <div className="text-xs text-brand-text-muted mb-1.5">Hosted Photo Page</div>
                  <div className="text-sm font-medium break-all text-brand-red">
                    {window.location.origin}/p/{currentPhotoId}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/p/${currentPhotoId}`);
                    }}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Copy Link
                  </button>
                  <button onClick={resetToGallery} className="btn-primary flex-1 text-sm">
                    New Photo
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Player Emails
                  </label>
                  <textarea
                    value={emailAddresses}
                    onChange={(e) => setEmailAddresses(e.target.value)}
                    placeholder="player1@email.com, player2@email.com"
                    rows={3}
                    className="input-field w-full resize-none"
                  />
                  <p className="text-xs text-brand-text-muted mt-1">
                    Separate multiple emails with commas or spaces
                  </p>
                </div>

                {/* Hosted link preview */}
                <div className="bg-brand-surface rounded-xl border border-white/5 p-4">
                  <div className="text-xs text-brand-text-muted mb-1">Hosted Photo Page</div>
                  <div className="text-sm text-brand-text-secondary break-all">
                    {window.location.origin}/p/{currentPhotoId}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('edit')}
                    className="btn-secondary flex-1"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleSendEmails}
                    disabled={sending || !emailAddresses.trim()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Photo
                  </button>
                </div>

                {/* Skip email - just save */}
                <button
                  onClick={() => {
                    setSendSuccess(true);
                  }}
                  className="w-full text-center text-sm text-brand-text-muted hover:text-brand-text-secondary transition-colors"
                >
                  Skip — just save the photo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ SETTINGS VIEW ═══════════════ */}
      {step === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview with current branding */}
          <div>
            <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
              <div className="aspect-[4/3] relative bg-brand-bg flex items-center justify-center">
                {settingsLogoUrl ? (
                  <div className="relative w-full h-full">
                    {/* Simulated photo background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
                      <Camera className="w-20 h-20 text-white/10" />
                    </div>
                    {/* Logo preview positioned */}
                    <img
                      src={settingsLogoUrl}
                      alt="Logo"
                      className="absolute max-w-[20%] max-h-[20%] object-contain"
                      style={{
                        ...(settingsLogoPosition === 'top-left' && { top: '5%', left: '5%' }),
                        ...(settingsLogoPosition === 'top-right' && { top: '5%', right: '5%' }),
                        ...(settingsLogoPosition === 'bottom-left' && { bottom: '5%', left: '5%' }),
                        ...(settingsLogoPosition === 'bottom-right' && { bottom: '5%', right: '5%' }),
                        ...(settingsLogoPosition === 'bottom-center' && { bottom: '5%', left: '50%', transform: 'translateX(-50%)' }),
                        opacity: settingsOpacity,
                      }}
                    />
                    {/* Text preview */}
                    {settingsTextTemplate && (
                      <div className="absolute bottom-0 left-0 right-0" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                        <p className="text-center text-white font-semibold text-sm py-4 px-3 uppercase tracking-wider">
                          {settingsTextTemplate.replace(/\{\{room\}\}/gi, roomTitle || 'Room Name').replace(/\{\{team\}\}/gi, 'Team Name').replace(/\{\{time\}\}/gi, '45:30')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : settingsOverlayUrl && settingsUseOverlay ? (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
                      <Camera className="w-20 h-20 text-white/10" />
                    </div>
                    <img src={settingsOverlayUrl} alt="Overlay" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: settingsOpacity }} />
                  </div>
                ) : (
                  <div className="text-center">
                    <Layers className="w-16 h-16 text-brand-border mx-auto mb-3" />
                    <p className="text-brand-text-muted text-sm">Upload a logo to see the preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Settings form */}
          <div className="space-y-5">
            {/* Mode toggle: Logo vs Overlay */}
            <div className="flex gap-2">
              <button
                onClick={() => setSettingsUseOverlay(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                  !settingsUseOverlay
                    ? 'bg-brand-red/20 border-brand-red/50 text-brand-red'
                    : 'bg-brand-surface border-white/10 text-brand-text-muted hover:border-white/20'
                }`}
              >
                <Image className="w-4 h-4" /> Logo Mode
              </button>
              <button
                onClick={() => setSettingsUseOverlay(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                  settingsUseOverlay
                    ? 'bg-brand-red/20 border-brand-red/50 text-brand-red'
                    : 'bg-brand-surface border-white/10 text-brand-text-muted hover:border-white/20'
                }`}
              >
                <Layers className="w-4 h-4" /> Overlay Mode
              </button>
            </div>

            {/* Logo upload (logo mode) */}
            {!settingsUseOverlay && (
              <>
                <div>
                  <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block">Logo</label>
                  <div className="flex items-center gap-3">
                    {settingsLogoUrl ? (
                      <div className="relative w-16 h-16 bg-brand-bg rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                        <img src={settingsLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          onClick={() => { setSettingsLogoUrl(''); setSettingsLogoStorageId(undefined); }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {settingsLogoUrl ? 'Change Logo' : 'Upload Logo'}
                    </button>
                  </div>
                  <p className="text-xs text-brand-text-muted mt-1">PNG with transparent background works best</p>
                </div>

                {/* Logo position */}
                <div>
                  <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Logo Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'top-left', label: 'Top Left' },
                      { value: 'top-right', label: 'Top Right' },
                      { value: 'bottom-left', label: 'Bottom Left' },
                      { value: 'bottom-right', label: 'Bottom Right' },
                      { value: 'bottom-center', label: 'Bottom Center' },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setSettingsLogoPosition(pos.value)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                          settingsLogoPosition === pos.value
                            ? 'bg-brand-red/20 border-brand-red/50 text-brand-red'
                            : 'bg-brand-surface border-white/10 text-brand-text-muted hover:border-white/20'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Overlay upload (overlay mode) */}
            {settingsUseOverlay && (
              <div>
                <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block">
                  Full-Frame Overlay
                </label>
                <div className="flex items-center gap-3">
                  {settingsOverlayUrl ? (
                    <div className="relative w-20 h-14 bg-brand-bg rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                      <img src={settingsOverlayUrl} alt="Overlay" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setSettingsOverlayUrl(''); setSettingsOverlayStorageId(undefined); }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => overlayInputRef.current?.click()}
                    disabled={uploadingOverlay}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    {uploadingOverlay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {settingsOverlayUrl ? 'Change Overlay' : 'Upload Overlay'}
                  </button>
                </div>
                <p className="text-xs text-brand-text-muted mt-1">
                  PNG with transparent areas — placed over the entire photo
                </p>
              </div>
            )}

            {/* Opacity */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block">
                Opacity ({Math.round(settingsOpacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settingsOpacity}
                onChange={(e) => setSettingsOpacity(parseFloat(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>

            {/* Brand color */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                <Palette className="w-4 h-4" /> Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settingsBrandColor}
                  onChange={(e) => setSettingsBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settingsBrandColor}
                  onChange={(e) => setSettingsBrandColor(e.target.value)}
                  className="input-field w-32 text-sm"
                  maxLength={7}
                />
              </div>
            </div>

            {/* Text template */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-1.5 block flex items-center gap-1.5">
                <Type className="w-4 h-4" /> Text Overlay
              </label>
              <input
                type="text"
                value={settingsTextTemplate}
                onChange={(e) => setSettingsTextTemplate(e.target.value)}
                placeholder="e.g. {{room}} — Escaped in {{time}}"
                className="input-field w-full"
              />
              <p className="text-xs text-brand-text-muted mt-1">
                Use {'{{room}}'}, {'{{team}}'}, {'{{time}}'} as placeholders
              </p>
            </div>

            {/* Default filter */}
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Default Filter</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSettingsDefaultFilter(f.name)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      settingsDefaultFilter === f.name
                        ? 'bg-brand-red text-white border-brand-red'
                        : 'bg-brand-surface border-white/10 text-brand-text-secondary hover:border-brand-red/30'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-2">
              <button onClick={resetToGallery} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Branding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Logo file input */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUploadLogo(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Overlay file input */}
      <input
        ref={overlayInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUploadOverlay(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Full-screen preview modal */}
      {modalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setModalUrl(null)}
        >
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={modalUrl} alt="Full preview" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
