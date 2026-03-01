'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import dynamic from 'next/dynamic';
import { api } from '../../../../../../convex/_generated/api';
import { useCompanyAuth } from '@/lib/companyAuth';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  ToggleLeft,
  ToggleRight,
  Star,
  Lock,
  CalendarClock,
  FileText,
  X,
  Upload,
  Loader2,
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

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { company } = useCompanyAuth();
  const roomId = params.id as string;

  const room = useQuery(api.rooms.getById, roomId ? { id: roomId as any } : 'skip');
  const updateRoom = useMutation(api.companies.updateRoom);
  const generateUploadUrl = useMutation(api.companies.generateUploadUrl);
  const getUrlMutation = useMutation(api.companies.getUrlMutation);

  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    title: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    image: '',
    duration: 60,
    difficulty: 3,
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
    operatingDays: [1, 2, 3, 4, 5, 6] as number[],
    defaultTimeSlots: [{ time: '10:00', price: 15 }] as { time: string; price: number }[],
    isActive: true,
    isFeatured: false,
    releaseDate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const PAYMENT_OPTIONS = [
    { value: 'full' as const, label: t('company.rooms.edit.payment_full') },
    { value: 'deposit_20' as const, label: t('company.rooms.edit.payment_deposit') },
    { value: 'pay_on_arrival' as const, label: t('company.rooms.edit.payment_arrival') },
  ];
  const WEEKDAYS = [
    t('common.day_sun'), t('common.day_mon'), t('common.day_tue'),
    t('common.day_wed'), t('common.day_thu'), t('common.day_fri'), t('common.day_sat')
  ];

  // Populate form from room data
  useEffect(() => {
    if (room && !loaded) {
      setForm({
        title: room.title || '',
        location: room.location || '',
        latitude: (room as any).latitude || undefined,
        longitude: (room as any).longitude || undefined,
        image: room.image || '',
        duration: room.duration || 60,
        difficulty: room.difficulty || 3,
        playersMin: room.playersMin || 2,
        playersMax: room.playersMax || 6,
        price: room.price || 15,
        pricePerGroup: (room as any).pricePerGroup || [],
        theme: room.theme || 'Adventure',
        tags: room.tags || [],
        description: room.description || '',
        story: room.story || '',
        paymentTerms: (room as any).paymentTerms || ['full'],
        termsOfUse: (room as any).termsOfUse || '',
        isSubscriptionOnly: (room as any).isSubscriptionOnly || false,
        operatingDays: (room as any).operatingDays || [1, 2, 3, 4, 5, 6],
        defaultTimeSlots: (room as any).defaultTimeSlots || [{ time: '10:00', price: 15 }],
        isActive: room.isActive !== false,
        isFeatured: (room as any).isFeatured || false,
        releaseDate: (room as any).releaseDate || '',
      });
      setLoaded(true);
    }
  }, [room, loaded]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateRoom({
        roomId: roomId as any,
        title: form.title,
        location: form.location,
        image: form.image,
        latitude: form.latitude,
        longitude: form.longitude,
        duration: form.duration,
        difficulty: form.difficulty,
        players: `${form.playersMin}-${form.playersMax}`,
        playersMin: form.playersMin,
        playersMax: form.playersMax,
        price: form.price,
        pricePerGroup: form.pricePerGroup.length > 0 ? form.pricePerGroup : undefined,
        theme: form.theme,
        tags: form.tags,
        description: form.description,
        story: form.story,
        paymentTerms: form.paymentTerms,
        termsOfUse: form.termsOfUse || undefined,
        isSubscriptionOnly: form.isSubscriptionOnly || undefined,
        operatingDays: form.operatingDays,
        defaultTimeSlots: form.defaultTimeSlots.filter((s) => s.time),
        isActive: form.isActive,
        isFeatured: form.isFeatured || undefined,
        releaseDate: form.releaseDate || undefined,
      });
      router.push('/company/rooms');
    } catch (err: any) {
      setError(err?.message || t('company.rooms.edit.failed_update'));
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div className="p-8 text-center text-brand-text-secondary">{t('company.rooms.edit.loading')}</div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/company/rooms" className="p-2 rounded-xl hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('company.rooms.edit.title')}</h1>
          <p className="text-brand-text-secondary mt-1">{form.title}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <SectionCard title={t('company.rooms.edit.basic_info')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldLabel>{t('company.rooms.edit.room_title')}</FieldLabel>
              <FieldInput value={form.title} onChange={(v) => updateField('title', v)} required />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>{t('company.rooms.edit.location')}</FieldLabel>
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
              <FieldLabel>{t('company.rooms.edit.theme')}</FieldLabel>
              <select
                value={form.theme}
                onChange={(e) => updateField('theme', e.target.value)}
                className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none"
              >
                {THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>{t('company.rooms.edit.duration_min')}</FieldLabel>
              <FieldInput type="number" value={form.duration} onChange={(v) => updateField('duration', parseInt(v) || 0)} min={15} required />
            </div>
          </div>
        </SectionCard>

        {/* Image */}
        <SectionCard title={t('company.rooms.edit.image')}>
          <FieldLabel>{t('company.rooms.new.main_image')}</FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setImagePreview(ev.target?.result as string);
              reader.readAsDataURL(file);
              setImageUploading(true);
              try {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': file.type },
                  body: file,
                });
                const { storageId } = await result.json();
                const url = await getUrlMutation({ storageId });
                if (url) updateField('image', url);
              } catch {
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
                <img src={imagePreview || form.image} alt="Room preview" className="w-full max-w-xs h-40 object-cover rounded-lg" />
                <p className="text-xs text-brand-text-secondary group-hover:text-brand-red transition-colors">{t('company.rooms.new.image_change')}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-brand-text-secondary group-hover:text-brand-red transition-colors" />
                <p className="text-sm text-brand-text-secondary group-hover:text-white transition-colors">{t('company.rooms.new.image_upload_prompt')}</p>
                <p className="text-xs text-brand-text-secondary/60">PNG, JPG, WebP — max 5MB</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Difficulty & Players */}
        <SectionCard title={t('company.rooms.edit.difficulty_players')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <FieldLabel>{t('company.rooms.edit.difficulty_label', { value: String(form.difficulty) })}</FieldLabel>
              <input
                type="range" min="1" max="5" value={form.difficulty}
                onChange={(e) => updateField('difficulty', parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>
            <div>
              <FieldLabel>{t('company.rooms.edit.min_players')}</FieldLabel>
              <FieldInput type="number" value={form.playersMin} onChange={(v) => updateField('playersMin', parseInt(v) || 1)} min={1} required />
            </div>
            <div>
              <FieldLabel>{t('company.rooms.edit.max_players')}</FieldLabel>
              <FieldInput type="number" value={form.playersMax} onChange={(v) => updateField('playersMax', parseInt(v) || 1)} min={form.playersMin} required />
            </div>
          </div>
        </SectionCard>

        {/* Pricing */}
        <SectionCard title={t('company.rooms.edit.pricing')}>
          <FieldLabel>{t('company.rooms.edit.base_price')}</FieldLabel>
          <FieldInput type="number" value={form.price} onChange={(v) => updateField('price', parseFloat(v) || 0)} min={0} step={0.5} required />

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>{t('company.rooms.edit.group_pricing')}</FieldLabel>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, pricePerGroup: [...p.pricePerGroup, { players: p.playersMin, price: p.price }] }))}
                className="text-sm text-brand-red hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t('company.rooms.edit.add_group_price')}
              </button>
            </div>
            {form.pricePerGroup.map((g, idx) => (
              <div key={idx} className="flex items-center gap-3 mb-2">
                <FieldInput type="number" value={g.players} onChange={(v) => {
                  const updated = [...form.pricePerGroup];
                  updated[idx] = { ...g, players: parseInt(v) || 0 };
                  updateField('pricePerGroup', updated);
                }} placeholder="Players" min={1} />
                <span className="text-brand-text-secondary">=</span>
                <FieldInput type="number" value={g.price} onChange={(v) => {
                  const updated = [...form.pricePerGroup];
                  updated[idx] = { ...g, price: parseFloat(v) || 0 };
                  updateField('pricePerGroup', updated);
                }} placeholder="€" min={0} step={0.5} />
                <button type="button" onClick={() => updateField('pricePerGroup', form.pricePerGroup.filter((_, i) => i !== idx))} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Tags */}
        <SectionCard title={t('company.rooms.edit.tags')}>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag} type="button" onClick={() => toggleTag(tag)}
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
        </SectionCard>

        {/* Story & Description */}
        <SectionCard title={t('company.rooms.edit.story_desc')}>
          <FieldLabel>{t('company.rooms.edit.story')}</FieldLabel>
          <textarea value={form.story} onChange={(e) => updateField('story', e.target.value)} rows={3}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none resize-none" required
          />
          <div className="mt-4">
            <FieldLabel>{t('company.rooms.edit.description')}</FieldLabel>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3}
              className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none resize-none" required
            />
          </div>
        </SectionCard>

        {/* Payment & Schedule */}
        <SectionCard title={t('company.rooms.edit.payment_terms')}>
          <div className="flex flex-wrap gap-3">
            {PAYMENT_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => togglePaymentTerm(opt.value)}
                className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                  form.paymentTerms.includes(opt.value) ? 'bg-brand-red/10 border-brand-red/30 text-brand-red' : 'border-white/10 text-brand-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t('company.rooms.edit.operating_days')}>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, idx) => (
              <button key={idx} type="button" onClick={() => toggleOperatingDay(idx)}
                className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${
                  form.operatingDays.includes(idx) ? 'bg-brand-red text-white' : 'bg-brand-bg border border-white/10 text-brand-text-secondary'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Time Slots */}
        <SectionCard title={t('company.rooms.edit.default_time_slots')}>
          {form.defaultTimeSlots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-2">
              <input type="time" value={slot.time} onChange={(e) => {
                const slots = [...form.defaultTimeSlots];
                slots[idx] = { ...slot, time: e.target.value };
                updateField('defaultTimeSlots', slots);
              }} className="bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-red focus:outline-none" />
              <span className="text-brand-text-secondary text-sm">€</span>
              <input type="number" value={slot.price} onChange={(e) => {
                const slots = [...form.defaultTimeSlots];
                slots[idx] = { ...slot, price: parseFloat(e.target.value) || 0 };
                updateField('defaultTimeSlots', slots);
              }} className="w-24 bg-brand-bg border border-white/10 rounded-xl px-3 py-3 text-white focus:border-brand-red focus:outline-none" min={0} step={0.5} />
              {form.defaultTimeSlots.length > 1 && (
                <button type="button" onClick={() => updateField('defaultTimeSlots', form.defaultTimeSlots.filter((_, i) => i !== idx))} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => updateField('defaultTimeSlots', [...form.defaultTimeSlots, { time: '', price: form.price }])}
            className="text-sm text-brand-red hover:underline flex items-center gap-1 mt-2"
          >
            <Plus className="w-3 h-3" /> Add Slot
          </button>
        </SectionCard>

        {/* Release Date (Early Access) */}
        <SectionCard title="Release Date">
          <div className="flex items-start gap-3 mb-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
            <CalendarClock className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-300">Early Access for Premium Players</p>
              <p className="text-xs text-brand-text-secondary mt-1">
                Set a future release date and UNLOCKED Premium subscribers will be able to book this room up to 3 days before it goes public.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Public Release Date (optional)</FieldLabel>
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
                  <p className="text-xs text-brand-text-muted">Premium early access starts</p>
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
        </SectionCard>

        {/* Submit */}
        {/* Featured Listing (Pro+ only) */}
        <SectionCard title="Visibility">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Featured Listing
              </p>
              <p className="text-sm text-brand-text-secondary mt-1">
                Featured rooms appear prominently on the homepage
              </p>
            </div>
            {(company?.platformPlan === 'pro' || company?.platformPlan === 'enterprise') ? (
              <button
                type="button"
                onClick={() => updateField('isFeatured', !form.isFeatured)}
              >
                {form.isFeatured ? (
                  <ToggleRight className="w-8 h-8 text-yellow-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-brand-text-secondary" />
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
                <Lock className="w-4 h-4" />
                <span>Pro plan required</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Terms of Use */}
        <SectionCard title="Terms of Use">
          <div className="flex flex-wrap gap-2 mb-3">
            {TERMS_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => {
                  if (form.termsOfUse.trim()) {
                    if (confirm('You already have terms written. Replace with this template?')) {
                      updateField('termsOfUse', tpl.body);
                    }
                  } else {
                    updateField('termsOfUse', tpl.body);
                  }
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-brand-text-secondary hover:border-brand-red/40 hover:text-brand-red transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                {tpl.label}
              </button>
            ))}
          </div>
          <textarea
            value={form.termsOfUse}
            onChange={(e) => updateField('termsOfUse', e.target.value)}
            rows={6}
            className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none resize-none leading-relaxed"
            placeholder="Select a template above or write your room-specific booking terms, cancellation policy, age requirements..."
          />
          {form.termsOfUse.trim() && (
            <button
              type="button"
              onClick={() => updateField('termsOfUse', '')}
              className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-red-400 mt-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear terms
            </button>
          )}
        </SectionCard>

        {/* Submit - Save */}
        <div className="flex gap-3 pt-4">
          <Link href="/company/rooms" className="btn-ghost text-sm flex-1 text-center">Cancel</Link>
          <button type="submit" disabled={loading}
            className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 p-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-brand-text-secondary mb-1.5">{children}</label>;
}

function FieldInput({ value, onChange, type = 'text', placeholder, required, min, max, step }: {
  value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; min?: number; max?: number; step?: number;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors"
      placeholder={placeholder} required={required} min={min} max={max} step={step}
    />
  );
}
