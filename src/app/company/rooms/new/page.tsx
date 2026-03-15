'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useAction } from 'convex/react';
import dynamic from 'next/dynamic';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useCompanyAuth, useCompanyPath } from '@/lib/companyAuth';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ImageIcon,
  AlertTriangle,
  Lock,
  CalendarClock,
  FileText,
  X,
  Upload,
  Loader2,
  Camera,
  Layers,
  Palette,
  Eye,
  AlertCircle,
  Image,
  ChevronDown,
  ChevronUp,
  Globe,
  Languages,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const LocationPicker = dynamic(
  () => import('@/components/map/LocationPicker'),
  { ssr: false, loading: () => (
    <div className="h-[300px] bg-brand-bg border border-white/10 rounded-xl flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-brand-red animate-spin" />
    </div>
  )}
);

const PLAN_ROOM_LIMITS: Record<string, number> = { free: 1, starter: 1, pro: 10, enterprise: Infinity };

const THEMES = ['Horror', 'Adventure', 'Sci-Fi', 'Mystery', 'Fantasy', 'Historical', 'Comedy', 'Thriller'];
const TAG_OPTIONS = ['Beginner Friendly', 'Team Building', 'Couples', 'Family', 'Intense', 'Immersive', 'Physical', 'Mental', 'Story Driven', 'Competitive'];

const TERMS_TEMPLATES = [
  {
    key: 'standard',
    label: 'Standard',
    body: '1. Booking & Cancellation\n- Cancellations must be made at least 24 hours before the scheduled session for a full refund.\n- Late cancellations or no-shows will be charged the full amount.\n- Rescheduling is allowed up to 12 hours before the session, subject to availability.\n\n2. Participation\n- All participants must sign a waiver before entering the room.\n- Participants must follow staff instructions at all times.\n- No food, drinks, or personal belongings are allowed inside the room.\n- The use of excessive force on props or equipment is prohibited.\n\n3. Safety\n- The room contains atmospheric effects (dim lighting, sound effects, fog).\n- Participants with claustrophobia, epilepsy, or heart conditions should consult a doctor before playing.\n- Emergency exits are available at all times.\n- A game master monitors the session via CCTV for safety purposes.\n\n4. Liability\n- The company is not liable for any personal injury caused by reckless behavior.\n- Participants are responsible for any damage to props or equipment.\n- Photography and video recording inside the room is not permitted unless stated otherwise.',
  },
  {
    key: 'strict',
    label: 'Strict',
    body: '1. Booking & Cancellation\n- All bookings are final and non-refundable.\n- Rescheduling is only permitted up to 48 hours in advance, subject to availability. One reschedule per booking.\n- No-shows forfeit the full booking amount.\n\n2. Arrival & Punctuality\n- Arrive at least 15 minutes before your scheduled session.\n- Late arrivals (10+ minutes) may result in session cancellation without refund.\n- Game time will NOT be extended for late arrivals.\n\n3. Rules\n- All participants must be 16 years or older. Valid ID may be required.\n- All participants must sign a liability waiver.\n- Zero tolerance for intoxicated participants — entry will be refused without refund.\n- No phones, cameras, bags, or food/drinks allowed inside the room.\n- Any damage to props or equipment will be charged.\n\n4. Safety & Monitoring\n- Sessions are monitored via CCTV and audio for safety.\n- Emergency exits are clearly marked and accessible.\n- Staff may intervene or terminate a session at any time for safety reasons.\n\n5. Liability\n- The company assumes no liability for injuries resulting from participant negligence.\n- By booking, you agree to these terms in full.',
  },
  {
    key: 'flexible',
    label: 'Flexible',
    body: '1. Booking & Cancellation\n- Free cancellation up to 6 hours before the session.\n- Cancellations less than 6 hours in advance: 50% charge.\n- Free rescheduling any time, subject to availability.\n\n2. Participation\n- All ages welcome (under 14 must be accompanied by an adult).\n- No waiver required for standard rooms.\n- Personal belongings can be stored in lockers provided.\n\n3. General Rules\n- Please follow the game master\'s instructions for the best experience.\n- No excessive force on any equipment or props.\n- Photos are welcome in the lobby area after your game!\n\n4. Safety\n- Emergency exits are available at all times — you are never truly locked in.\n- Staff monitors all sessions for your safety.\n- If you feel uncomfortable at any point, notify the game master immediately.\n\n5. Have Fun!\n- This experience is designed for enjoyment. Work as a team and enjoy the adventure!',
  },
  {
    key: 'minors',
    label: 'Minors Policy',
    body: '1. Age Requirements\n- Participants under 16 years old must be accompanied by an adult (18+) at all times.\n- Children under 10 are NOT permitted in horror-themed rooms.\n- The accompanying adult assumes full responsibility for the minor(s).\n\n2. Parental Consent\n- A parent or legal guardian must sign the waiver on behalf of minors.\n- The guardian must remain on the premises during the session.\n\n3. Content Warning\n- Some rooms contain intense themes, jump scares, dim lighting, and loud sound effects.\n- Parents/guardians are advised to review room descriptions before booking for minors.\n\n4. Group Composition\n- For groups with only minors (16-17), at least one participant must have signed parental consent on file.\n- Maximum of 2 minors per adult in the room.\n\n5. Safety\n- All standard safety terms apply.\n- Staff will prioritize the wellbeing of minor participants.\n- Sessions may be paused or stopped if a minor shows signs of distress.',
  },
];

export default function NewRoomPage() {
  const router = useRouter();
  const { company } = useCompanyAuth();
  const p = useCompanyPath();
  const createRoom = useMutation(api.companies.createRoom);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrlMutation = useMutation(api.companies.getUrlMutation);
  const savePreset = useMutation(api.bookingPhotos.savePreset);
  const photoPreset = useQuery(
    api.bookingPhotos.getPreset,
    company?.id ? { companyId: company.id as any } : 'skip'
  );
  const stats = useQuery(
    api.companies.getDashboardStats,
    company?.id ? { companyId: company.id as any } : 'skip'
  );

  const plan = (stats as any)?.plan || company?.platformPlan || 'starter';
  const roomLimit = PLAN_ROOM_LIMITS[plan] || 3;
  const roomCount = stats?.totalRooms ?? 0;
  const atLimit = roomCount >= roomLimit;

  const [form, setForm] = useState({
    title: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    image: '',
    images: [] as string[],
    duration: 60,
    difficulty: 3,
    maxDifficulty: 5,
    playersMin: 2,
    playersMax: 6,
    price: 15,
    pricePerGroup: [] as { players: number; price: number }[],
    theme: 'Adventure',
    tags: [] as string[],
    description: '',
    story: '',
    paymentTerms: ['full'] as ('full' | 'deposit_20' | 'pay_on_arrival')[],
    termsOfUse: '',
    isSubscriptionOnly: false,
    bookingMode: 'unlocked_primary' as 'unlocked_primary' | 'external_primary',
    operatingDays: [1, 2, 3, 4, 5, 6] as number[],
    defaultTimeSlots: [{ time: '10:00', price: 15 }] as { time: string; price: number }[],
    overflowSlot: null as null | { time: string; price: number; days: number[] },
    releaseDate: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useTranslation();

  // ── Translation State ──
  const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'el', label: 'Ελληνικά' },
    { code: 'nl', label: 'Nederlands' },
  ] as const;
  const [storyTranslations, setStoryTranslations] = useState<Record<string, string>>({});
  const [descTranslations, setDescTranslations] = useState<Record<string, string>>({});
  const [showTranslations, setShowTranslations] = useState(false);

  const autoTranslateRoom = useAction(api.translate.autoTranslateRoom);

  // Company data for auto-translate check
  const companyData = useQuery(
    api.companies.getById,
    company?.id ? { id: company.id as any } : 'skip'
  );

  // ── Photo Branding State ──
  const [photoBrandingOpen, setPhotoBrandingOpen] = useState(false);
  const [presetForm, setPresetForm] = useState({
    logoPosition: 'bottom-right' as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center',
    brandColor: '#FF1E1E',
    watermarkOpacity: 0.3,
    textTemplate: '',
  });
  const [presetLogoUrl, setPresetLogoUrl] = useState('');
  const [presetLogoStorageId, setPresetLogoStorageId] = useState<any>(null);
  const [presetLogoPreview, setPresetLogoPreview] = useState('');
  const [presetLogoUploading, setPresetLogoUploading] = useState(false);
  const [presetSaving, setPresetSaving] = useState(false);
  const [presetMsg, setPresetMsg] = useState('');
  const [presetLoaded, setPresetLoaded] = useState(false);
  const presetLogoRef = useRef<HTMLInputElement>(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [overlayStorageId, setOverlayStorageId] = useState<any>(null);
  const [overlayPreview, setOverlayPreview] = useState('');
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [useOverlay, setUseOverlay] = useState(false);
  const overlayRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (photoPreset && !presetLoaded) {
      setPresetForm({
        logoPosition: photoPreset.logoPosition || 'bottom-right',
        brandColor: photoPreset.brandColor || '#FF1E1E',
        watermarkOpacity: photoPreset.watermarkOpacity ?? 0.3,
        textTemplate: photoPreset.textTemplate || '',
      });
      setPresetLogoUrl(photoPreset.logoUrl || '');
      setPresetLogoStorageId(photoPreset.logoStorageId || null);
      setOverlayUrl(photoPreset.overlayUrl || '');
      setOverlayStorageId(photoPreset.overlayStorageId || null);
      setUseOverlay(photoPreset.useOverlay || false);
      setPresetLoaded(true);
    }
  }, [photoPreset, presetLoaded]);

  const PAYMENT_OPTIONS = [
    { value: 'full' as const, label: t('company.rooms.new.payment_full') },
    { value: 'deposit_20' as const, label: t('company.rooms.new.payment_deposit') },
    { value: 'pay_on_arrival' as const, label: t('company.rooms.new.payment_arrival') },
  ];
  const WEEKDAYS = [
    t('common.day_sun'), t('common.day_mon'), t('common.day_tue'),
    t('common.day_wed'), t('common.day_thu'), t('common.day_fri'), t('common.day_sat')
  ];

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const togglePaymentTerm = (term: 'full' | 'deposit_20' | 'pay_on_arrival') => {
    setForm((prev) => ({
      ...prev,
      paymentTerms: prev.paymentTerms.includes(term)
        ? prev.paymentTerms.filter((t) => t !== term)
        : [...prev.paymentTerms, term],
    }));
  };

  const toggleOperatingDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter((d) => d !== day)
        : [...prev.operatingDays, day].sort(),
    }));
  };

  const addTimeSlot = () => {
    setForm((prev) => ({
      ...prev,
      defaultTimeSlots: [...prev.defaultTimeSlots, { time: '', price: prev.price }],
    }));
  };

  const updateTimeSlot = (idx: number, field: 'time' | 'price', value: any) => {
    setForm((prev) => ({
      ...prev,
      defaultTimeSlots: prev.defaultTimeSlots.map((s, i) =>
        i === idx ? { ...s, [field]: field === 'price' ? parseFloat(value) || 0 : value } : s
      ),
    }));
  };

  const removeTimeSlot = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      defaultTimeSlots: prev.defaultTimeSlots.filter((_, i) => i !== idx),
    }));
  };

  const addGroupPrice = () => {
    setForm((prev) => ({
      ...prev,
      pricePerGroup: [...prev.pricePerGroup, { players: prev.playersMin, price: prev.price }],
    }));
  };

  const updateGroupPrice = (idx: number, field: 'players' | 'price', value: number) => {
    setForm((prev) => ({
      ...prev,
      pricePerGroup: prev.pricePerGroup.map((g, i) =>
        i === idx ? { ...g, [field]: value } : g
      ),
    }));
  };

  const removeGroupPrice = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      pricePerGroup: prev.pricePerGroup.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!company?.id) return;
    if (form.paymentTerms.length === 0) {
      setError(t('company.rooms.new.error_payment_terms'));
      return;
    }
    setLoading(true);
    try {
      // Build manual translations (filter empty strings)
      const storyTrans: Record<string, string> = {};
      const descTrans: Record<string, string> = {};
      for (const [k, v] of Object.entries(storyTranslations)) {
        if (v.trim()) storyTrans[k] = v;
      }
      for (const [k, v] of Object.entries(descTranslations)) {
        if (v.trim()) descTrans[k] = v;
      }

      const roomId = await createRoom({
        companyId: company.id as any,
        title: form.title,
        location: form.location,
        image: form.image || '/placeholder-room.jpg',
        images: form.images.length > 0 ? form.images : undefined,
        duration: form.duration,
        difficulty: form.difficulty,
        maxDifficulty: form.maxDifficulty,
        players: `${form.playersMin}-${form.playersMax}`,
        playersMin: form.playersMin,
        playersMax: form.playersMax,
        price: form.price,
        pricePerGroup: form.pricePerGroup.length > 0 ? form.pricePerGroup : undefined,
        theme: form.theme,
        tags: form.tags,
        description: form.description,
        story: form.story,
        storyTranslations: Object.keys(storyTrans).length > 0 ? storyTrans as any : undefined,
        descriptionTranslations: Object.keys(descTrans).length > 0 ? descTrans as any : undefined,
        paymentTerms: form.paymentTerms,
        termsOfUse: form.termsOfUse || undefined,
        isSubscriptionOnly: form.isSubscriptionOnly || undefined,
        bookingMode: form.bookingMode || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        operatingDays: form.operatingDays.length > 0 ? form.operatingDays : undefined,
        defaultTimeSlots: form.defaultTimeSlots.filter((s) => s.time).length > 0
          ? form.defaultTimeSlots.filter((s) => s.time)
          : undefined,
        overflowSlot: form.overflowSlot || undefined,
        releaseDate: form.releaseDate || undefined,
      });

      // Trigger auto-translate if company has it enabled
      if ((companyData as any)?.autoTranslateEnabled && form.story && form.description) {
        try {
          await autoTranslateRoom({
            roomId: roomId as any,
            story: form.story,
            description: form.description,
            sourceLang: language,
          });
        } catch {
          // auto-translate is best-effort, don't block save
        }
      }

      router.push(p('/company/rooms'));
    } catch (err: any) {
      setError(err?.message || t('company.rooms.new.failed_create'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={p('/company/rooms')}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('company.rooms.new.title')}</h1>
          <p className="text-brand-text-secondary mt-1">
            {t('company.rooms.new.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {atLimit && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-400">{t('company.rooms.new.limit_warning')}</p>
            <p className="text-sm text-brand-text-secondary mt-1">
              {t('company.rooms.new.limit_plan_info', { plan, limit: roomLimit === Infinity ? 'unlimited' : String(roomLimit), count: String(roomCount) })}
              {plan !== 'enterprise' && (
                <> {t('company.rooms.new.upgrade_in_settings')} <Link href={p('/company/settings')} className="text-brand-red hover:underline">{t('company.rooms.new.settings_link')}</Link> {t('company.rooms.new.to_add_more')}</>
              )}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Section title={t('company.rooms.new.basic_info')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{t('company.rooms.new.room_title')}</Label>
              <Input
                value={form.title}
                onChange={(v) => updateField('title', v)}
                placeholder={t('company.rooms.new.room_title_placeholder')}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t('company.rooms.new.location')}</Label>
              <LocationPicker
                location={form.location}
                latitude={form.latitude}
                longitude={form.longitude}
                onLocationChange={(loc, lat, lng) => {
                  setForm((prev) => ({ ...prev, location: loc, latitude: lat, longitude: lng }));
                }}
                placeholder={t('company.rooms.new.location_search_placeholder')}
                searchLabel={t('company.rooms.new.location_search')}
                pinHint={t('company.rooms.new.location_pin_hint')}
              />
            </div>
            <div>
              <Label>{t('company.rooms.new.theme')}</Label>
              <select
                value={form.theme}
                onChange={(e) => updateField('theme', e.target.value)}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              >
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('company.rooms.new.duration_min')}</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(v) => updateField('duration', parseInt(v) || 0)}
                min={15}
                max={180}
                required
              />
            </div>
          </div>
        </Section>

        {/* Images */}
        <Section title={t('company.rooms.new.images')}>
          <div>
            <Label>{t('company.rooms.new.main_image')}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Convert to web-compatible format (handles HEIC, etc.)
                const { convertToWebFormat } = await import('@/lib/imageUtils');
                const webFile = await convertToWebFormat(file);

                // Show local preview immediately
                const reader = new FileReader();
                reader.onload = (ev) => setImagePreview(ev.target?.result as string);
                reader.readAsDataURL(webFile);

                // Upload to Convex storage
                setImageUploading(true);
                try {
                  const uploadUrl = await generateUploadUrl();
                  const result = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': webFile.type },
                    body: webFile,
                  });
                  const { storageId } = await result.json();
                  const url = await getUrlMutation({ storageId });
                  if (url) {
                    updateField('image', url);
                  }
                } catch (err) {
                  setError(t('company.rooms.new.image_upload_error'));
                } finally {
                  setImageUploading(false);
                }
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-red/40 rounded-xl p-6 text-center transition-all group"
            >
              {imageUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                  <p className="text-sm text-brand-text-secondary">{t('company.rooms.new.image_uploading')}</p>
                </div>
              ) : (imagePreview || form.image) ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={imagePreview || form.image}
                    alt="Room preview"
                    className="w-full max-w-xs h-40 object-cover rounded-lg"
                  />
                  <p className="text-xs text-brand-text-secondary group-hover:text-brand-red transition-colors">
                    {t('company.rooms.new.image_change')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-brand-text-secondary group-hover:text-brand-red transition-colors" />
                  <p className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">
                    {t('company.rooms.new.image_upload_prompt')}
                  </p>
                  <p className="text-xs text-brand-text-secondary/60">
                    PNG, JPG, WebP — max 5MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Difficulty & Players */}
        <Section title={t('company.rooms.new.difficulty_players')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t('company.rooms.new.difficulty_label', { current: String(form.difficulty), max: String(form.maxDifficulty) })}</Label>
              <input
                type="range"
                min="1"
                max={form.maxDifficulty}
                value={form.difficulty}
                onChange={(e) => updateField('difficulty', parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
              <div className="text-sm text-brand-text-secondary mt-1">
                {'★'.repeat(form.difficulty)}{'☆'.repeat(form.maxDifficulty - form.difficulty)}
              </div>
            </div>
            <div>
              <Label>{t('company.rooms.new.min_players')}</Label>
              <Input
                type="number"
                value={form.playersMin}
                onChange={(v) => updateField('playersMin', parseInt(v) || 1)}
                min={1}
                required
              />
            </div>
            <div>
              <Label>{t('company.rooms.new.max_players')}</Label>
              <Input
                type="number"
                value={form.playersMax}
                onChange={(v) => updateField('playersMax', parseInt(v) || 1)}
                min={form.playersMin}
                required
              />
            </div>
          </div>
        </Section>

        {/* Pricing */}
        <Section title={t('company.rooms.new.pricing')}>
          <div>
            <Label>{t('company.rooms.new.base_price')}</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(v) => updateField('price', parseFloat(v) || 0)}
              min={0}
              step={0.5}
              required
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>{t('company.rooms.new.group_pricing')}</Label>
              <button
                type="button"
                onClick={addGroupPrice}
                className="text-sm text-brand-red hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t('company.rooms.new.add_group_price')}
              </button>
            </div>
            {form.pricePerGroup.map((g, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3 mb-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={g.players}
                    onChange={(v) => updateGroupPrice(idx, 'players', parseInt(v) || 0)}
                    placeholder="Players"
                    min={1}
                  />
                </div>
                <span className="text-brand-text-secondary">=</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={g.price}
                    onChange={(v) => updateGroupPrice(idx, 'price', parseFloat(v) || 0)}
                    placeholder="€ price"
                    min={0}
                    step={0.5}
                  />
                </div>
                <button type="button" onClick={() => removeGroupPrice(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Tags */}
        <Section title={t('company.rooms.new.tags')}>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                  form.tags.includes(tag)
                    ? 'bg-brand-red/10 border-brand-red/30 text-brand-red'
                    : 'border-white/10 text-brand-text-secondary hover:border-white/20'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </Section>

        {/* Story & Description */}
        <Section title={t('company.rooms.new.story_desc')}>
          <div>
            <Label>{t('company.rooms.new.story_label')}</Label>
            <textarea
              value={form.story}
              onChange={(e) => updateField('story', e.target.value)}
              rows={3}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder={t('company.rooms.new.story_placeholder')}
              required
            />
          </div>
          <div className="mt-4">
            <Label>{t('company.rooms.new.description_label')}</Label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none"
              placeholder={t('company.rooms.new.description_placeholder')}
              required
            />
          </div>

          {/* Translations Section */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-white transition-colors"
            >
              <Globe className="w-4 h-4" />
              {t('company.rooms.edit.translations')}
              {showTranslations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTranslations && (
              <div className="mt-4 space-y-4">
                {!(companyData as any)?.autoTranslateEnabled && (
                  <p className="text-xs text-brand-text-muted">
                    {t('company.rooms.edit.enable_auto_translate')}
                  </p>
                )}
                {(companyData as any)?.autoTranslateEnabled && (
                  <p className="text-xs text-green-400">
                    {t('company.rooms.edit.auto_translate_on_save')}
                  </p>
                )}

                {/* Per-language translation fields */}
                {LANGS.map((lang) => (
                  <div key={lang.code} className="p-3 bg-brand-bg rounded-xl border border-white/5">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-brand-text-secondary" />
                      {lang.label}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-brand-text-muted">{t('company.rooms.edit.story')}</label>
                        <textarea
                          value={storyTranslations[lang.code] || ''}
                          onChange={(e) => setStoryTranslations((prev) => ({ ...prev, [lang.code]: e.target.value }))}
                          rows={2}
                          className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-red focus:outline-none resize-none"
                          placeholder={`${t('company.rooms.new.story_label')} (${lang.label})`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brand-text-muted">{t('company.rooms.edit.description')}</label>
                        <textarea
                          value={descTranslations[lang.code] || ''}
                          onChange={(e) => setDescTranslations((prev) => ({ ...prev, [lang.code]: e.target.value }))}
                          rows={2}
                          className="w-full bg-brand-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-red focus:outline-none resize-none"
                          placeholder={`${t('company.rooms.new.description_label')} (${lang.label})`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Payment Terms */}
        <Section title={t('company.rooms.new.payment_terms')}>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePaymentTerm(opt.value)}
                className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                  form.paymentTerms.includes(opt.value)
                    ? 'bg-brand-red/10 border-brand-red/30 text-brand-red'
                    : 'border-white/10 text-brand-text-secondary hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Operating Days */}
        <Section title={t('company.rooms.new.operating_days')}>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleOperatingDay(idx)}
                className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${
                  form.operatingDays.includes(idx)
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-bg border border-white/10 text-brand-text-secondary hover:border-white/20'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </Section>

        {/* Default Time Slots */}
        <Section title={t('company.rooms.new.default_time_slots')}>
          <p className="text-sm text-brand-text-secondary mb-3">
            {t('company.rooms.new.time_slots_desc')}
          </p>
          {form.defaultTimeSlots.map((slot, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 mb-2">
              <input
                type="time"
                value={slot.time}
                onChange={(e) => updateTimeSlot(idx, 'time', e.target.value)}
                className="bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
                required
              />
              <div className="flex items-center gap-1">
                <span className="text-brand-text-secondary text-sm">€</span>
                <input
                  type="number"
                  value={slot.price}
                  onChange={(e) => updateTimeSlot(idx, 'price', e.target.value)}
                  className="w-24 bg-brand-bg border border-white/10 rounded-xl px-3 py-3 text-white focus:border-brand-red focus:outline-none"
                  min={0}
                  step={0.5}
                />
              </div>
              {form.defaultTimeSlots.length > 1 && (
                <button type="button" onClick={() => removeTimeSlot(idx)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="text-sm text-brand-red hover:underline flex items-center gap-1 mt-2"
          >
            <Plus className="w-3 h-3" /> {t('company.rooms.new.add_time_slot')}
          </button>
        </Section>

        {/* Release Date (Early Access) */}
        <Section title={t('company.rooms.new.release_date')}>
          <div className="flex items-start gap-3 mb-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
            <CalendarClock className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-300">{t('company.rooms.new.early_access_title')}</p>
              <p className="text-xs text-brand-text-secondary mt-1">
                {t('company.rooms.new.early_access_desc')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('company.rooms.new.public_release_date')}</Label>
              <input
                type="date"
                value={form.releaseDate}
                onChange={(e) => updateField('releaseDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            {form.releaseDate && (
              <div className="flex items-center gap-3">
                <div className="bg-brand-surface rounded-xl p-4 border border-white/5 flex-1">
                  <p className="text-xs text-brand-text-muted">{t('company.rooms.new.premium_access_starts')}</p>
                  <p className="text-sm font-bold mt-1">
                    {(() => {
                      const d = new Date(form.releaseDate);
                      d.setDate(d.getDate() - 3);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('releaseDate', '')}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Photo Branding */}
        <div className="bg-brand-surface rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setPhotoBrandingOpen(!photoBrandingOpen)}
            className="w-full flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-red" />
              <h2 className="text-lg font-bold">{t('company.settings.photos_title')}</h2>
            </div>
            {photoBrandingOpen ? <ChevronUp className="w-5 h-5 text-brand-text-secondary" /> : <ChevronDown className="w-5 h-5 text-brand-text-secondary" />}
          </button>
          {photoBrandingOpen && (
            <div className="px-6 pb-6 space-y-5">
              <p className="text-sm text-brand-text-secondary">
                {t('company.settings.photos_desc')}
              </p>

              {presetMsg && (
                <div className={`rounded-xl p-3 text-sm ${presetMsg.includes('✓') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {presetMsg}
                </div>
              )}

              {/* Branding Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  {t('company.settings.photos_mode')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setUseOverlay(false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${!useOverlay ? 'border-brand-red bg-brand-red/10' : 'border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Upload className="w-4 h-4 text-brand-red" />
                      <span className="font-semibold text-sm">{t('company.settings.photos_mode_logo')}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted">{t('company.settings.photos_mode_logo_desc')}</p>
                  </button>
                  <button type="button" onClick={() => setUseOverlay(true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${useOverlay ? 'border-brand-red bg-brand-red/10' : 'border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-brand-red" />
                      <span className="font-semibold text-sm">{t('company.settings.photos_mode_overlay')}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted">{t('company.settings.photos_mode_overlay_desc')}</p>
                  </button>
                </div>
              </div>

              {/* OVERLAY MODE */}
              {useOverlay && (
                <div className="space-y-5 bg-brand-bg/50 rounded-xl p-5 border border-white/5">
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">{t('company.settings.photos_overlay')}</label>
                    <input ref={overlayRef} type="file" accept="image/png" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setOverlayPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        setOverlayUploading(true);
                        try {
                          const uploadUrl = await generateUploadUrl();
                          const result = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
                          const { storageId } = await result.json();
                          const url = await getUrlMutation({ storageId });
                          if (url) { setOverlayUrl(url); setOverlayStorageId(storageId); }
                        } catch { setPresetMsg('Failed to upload overlay'); }
                        finally { setOverlayUploading(false); }
                      }}
                    />
                    <div onClick={() => overlayRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-red/40 rounded-xl p-6 text-center transition-all group">
                      {overlayUploading ? (
                        <Loader2 className="w-10 h-10 text-brand-red animate-spin mx-auto" />
                      ) : (overlayPreview || overlayUrl) ? (
                        <div className="relative w-full max-w-sm mx-auto">
                          <div className="bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23333%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23333%22%2F%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23555%22%2F%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23555%22%2F%3E%3C%2Fsvg%3E')] rounded-xl overflow-hidden aspect-video">
                            <img src={overlayPreview || overlayUrl} alt="Overlay" className="w-full h-full object-contain" />
                          </div>
                          <p className="text-xs text-brand-text-muted mt-2">{t('company.settings.photos_change_overlay')}</p>
                        </div>
                      ) : (
                        <div>
                          <Layers className="w-10 h-10 text-brand-text-secondary group-hover:text-brand-red transition-colors mx-auto mb-2" />
                          <p className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">{t('company.settings.photos_upload_overlay')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">
                      {t('company.settings.photos_overlay_opacity')} ({Math.round(presetForm.watermarkOpacity * 100)}%)
                    </label>
                    <input type="range" min="0" max="100" value={presetForm.watermarkOpacity * 100}
                      onChange={(e) => setPresetForm({ ...presetForm, watermarkOpacity: parseInt(e.target.value) / 100 })}
                      className="w-full accent-[#FF1E1E]"
                    />
                  </div>
                  {overlayUrl && (
                    <div>
                      <label className="block text-sm text-brand-text-secondary mb-2"><Eye className="w-4 h-4 inline mr-1" />{t('company.settings.photos_preview')}</label>
                      <div className="relative w-full max-w-md aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20"><Image className="w-16 h-16" /></div>
                        <img src={overlayPreview || overlayUrl} alt="Overlay preview" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: presetForm.watermarkOpacity }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LOGO MODE */}
              {!useOverlay && (
                <div className="space-y-5">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">{t('company.settings.photos_logo')}</label>
                    <input ref={presetLogoRef} type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setPresetLogoPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        setPresetLogoUploading(true);
                        try {
                          const uploadUrl = await generateUploadUrl();
                          const result = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
                          const { storageId } = await result.json();
                          const url = await getUrlMutation({ storageId });
                          if (url) { setPresetLogoUrl(url); setPresetLogoStorageId(storageId); }
                        } catch { setPresetMsg('Failed to upload logo'); }
                        finally { setPresetLogoUploading(false); }
                      }}
                    />
                    <div onClick={() => presetLogoRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-white/10 hover:border-brand-red/40 rounded-xl p-4 text-center transition-all group inline-flex items-center gap-4">
                      {presetLogoUploading ? (
                        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                      ) : (presetLogoPreview || presetLogoUrl) ? (
                        <img src={presetLogoPreview || presetLogoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-1" />
                      ) : (
                        <div className="w-16 h-16 bg-brand-bg rounded-lg flex items-center justify-center">
                          <Upload className="w-6 h-6 text-brand-text-secondary group-hover:text-brand-red transition-colors" />
                        </div>
                      )}
                      <span className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">
                        {presetLogoUrl ? t('company.settings.photos_change_logo') : t('company.settings.photos_upload_logo')}
                      </span>
                    </div>
                  </div>

                  {/* Logo Position */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">{t('company.settings.photos_logo_pos')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'bottom-center'] as const).map((pos) => (
                        <button key={pos} type="button" onClick={() => setPresetForm({ ...presetForm, logoPosition: pos })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${presetForm.logoPosition === pos ? 'border-brand-red bg-brand-red/10 text-brand-red' : 'border-white/10 text-brand-text-secondary hover:border-brand-red/30'}`}>
                          {t(`company.settings.photos_pos_${pos.replace('-', '_')}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2"><Palette className="w-4 h-4 inline mr-1" />{t('company.settings.photos_brand_color')}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={presetForm.brandColor} onChange={(e) => setPresetForm({ ...presetForm, brandColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                      <input type="text" value={presetForm.brandColor} onChange={(e) => setPresetForm({ ...presetForm, brandColor: e.target.value })}
                        className="w-28 bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-brand-red focus:outline-none" placeholder="#FF1E1E" />
                    </div>
                  </div>

                  {/* Watermark Opacity */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">
                      {t('company.settings.photos_opacity')} ({Math.round(presetForm.watermarkOpacity * 100)}%)
                    </label>
                    <input type="range" min="0" max="100" value={presetForm.watermarkOpacity * 100}
                      onChange={(e) => setPresetForm({ ...presetForm, watermarkOpacity: parseInt(e.target.value) / 100 })}
                      className="w-full accent-[#FF1E1E]" />
                  </div>

                  {/* Text Template */}
                  <div>
                    <label className="block text-sm text-brand-text-secondary mb-2">{t('company.settings.photos_text_template')}</label>
                    <input type="text" value={presetForm.textTemplate}
                      onChange={(e) => setPresetForm({ ...presetForm, textTemplate: e.target.value })}
                      placeholder={t('company.settings.photos_text_placeholder')}
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none" />
                    <p className="text-xs text-brand-text-secondary mt-1">{t('company.settings.photos_text_hint')}</p>
                  </div>

                  {/* Preview */}
                  {(presetLogoUrl || presetForm.textTemplate) && (
                    <div>
                      <label className="block text-sm text-brand-text-secondary mb-2"><Eye className="w-4 h-4 inline mr-1" />{t('company.settings.photos_preview')}</label>
                      <div className="relative w-full max-w-md h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20"><Image className="w-16 h-16" /></div>
                        {presetLogoUrl && (
                          <img src={presetLogoPreview || presetLogoUrl} alt="Logo"
                            className={`absolute w-12 h-12 object-contain ${
                              presetForm.logoPosition === 'top-left' ? 'top-3 left-3' :
                              presetForm.logoPosition === 'top-right' ? 'top-3 right-3' :
                              presetForm.logoPosition === 'bottom-left' ? 'bottom-3 left-3' :
                              presetForm.logoPosition === 'bottom-right' ? 'bottom-3 right-3' :
                              'bottom-3 left-1/2 -translate-x-1/2'
                            }`} style={{ opacity: presetForm.watermarkOpacity }} />
                        )}
                        {presetForm.textTemplate && (
                          <>
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-10 w-10 h-0.5 rounded-full" style={{ backgroundColor: presetForm.brandColor }} />
                            <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold uppercase tracking-[0.15em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                              style={{ textShadow: `0 0 12px ${presetForm.brandColor}40` }}>
                              {presetForm.textTemplate.replace('{{room}}', 'Room Name').replace('{{time}}', '45:23').replace('{{date}}', '25/12/2025')}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Save Preset */}
              <div className="pt-2">
                <button type="button" disabled={presetSaving}
                  onClick={async () => {
                    if (!company?.id) return;
                    setPresetSaving(true); setPresetMsg('');
                    try {
                      await savePreset({
                        companyId: company.id as any,
                        logoUrl: presetLogoUrl || undefined,
                        logoStorageId: presetLogoStorageId || undefined,
                        logoPosition: presetForm.logoPosition,
                        brandColor: presetForm.brandColor,
                        watermarkOpacity: presetForm.watermarkOpacity,
                        textTemplate: presetForm.textTemplate || undefined,
                        overlayUrl: overlayUrl || undefined,
                        overlayStorageId: overlayStorageId || undefined,
                        useOverlay,
                      });
                      setPresetMsg('✓ ' + t('company.settings.photos_saved'));
                    } catch { setPresetMsg(t('company.settings.photos_save_error')); }
                    finally { setPresetSaving(false); }
                  }}
                  className="btn-primary flex items-center gap-2">
                  {presetSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('company.settings.photos_save')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced */}
        <Section title={t('company.rooms.new.advanced_settings')}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-xl border border-white/5">
              <div>
                <p className="font-medium">{t('company.rooms.new.subscription_only')}</p>
                <p className="text-sm text-brand-text-secondary">
                  {t('company.rooms.new.subscription_only_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateField('isSubscriptionOnly', !form.isSubscriptionOnly)}
                className="text-2xl"
              >
                {form.isSubscriptionOnly ? (
                  <ToggleRight className="w-8 h-8 text-brand-red" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-brand-text-secondary" />
                )}
              </button>
            </div>

            {/* Terms of Use */}
            <div>
              <Label>{t('company.rooms.new.terms_of_use')}</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {TERMS_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => {
                      if (form.termsOfUse.trim()) {
                        if (confirm(t('company.rooms.new.replace_template'))) {
                          updateField('termsOfUse', tpl.body);
                        }
                      } else {
                        updateField('termsOfUse', tpl.body);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-brand-text-secondary hover:border-brand-red/40 hover:text-brand-red transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t(`company.rooms.new.terms_${tpl.key}`)}
                  </button>
                ))}
              </div>
              <textarea
                value={form.termsOfUse}
                onChange={(e) => updateField('termsOfUse', e.target.value)}
                rows={6}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none leading-relaxed"
                placeholder={t('company.rooms.new.terms_placeholder')}
              />
              {form.termsOfUse.trim() && (
                <button
                  type="button"
                  onClick={() => updateField('termsOfUse', '')}
                  className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-red-400 mt-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('company.rooms.new.clear_terms')}
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Link
            href={p('/company/rooms')}
            className="btn-ghost text-sm flex-1 text-center"
          >
            {t('company.rooms.new.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading || atLimit}
            className={`text-sm flex-1 flex items-center justify-center gap-2 ${
              atLimit ? 'bg-white/5 text-brand-text-secondary cursor-not-allowed rounded-xl py-2.5' : 'btn-primary'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : atLimit ? (
              <>
                <Lock className="w-4 h-4" /> {t('company.rooms.new.room_limit_reached')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {t('company.rooms.new.create_room')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-brand-text-secondary mb-1.5">{children}</label>;
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  min,
  max,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
    />
  );
}

function ToggleRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="6" />
      <circle cx="16" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function ToggleLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="6" />
      <circle cx="8" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
