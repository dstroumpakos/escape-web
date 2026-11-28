'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, DoorOpen, ExternalLink, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, ShieldAlert, Store, Trash2, Users } from 'lucide-react';
import { api } from '../../../../convex/_generated/api';
import { useCompanyAuth, useCompanyMutation, useCompanyQuery, useMainSiteUrl, useCompanyPath } from '@/lib/companyAuth';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/company/Toast';
import { friendlyError } from '@/lib/errors';
import { CompanyInfoForm } from '@/components/company/CompanyInfoForm';
import { PhotoViewer } from '@/components/community/PhotoViewer';
import { VideoThumb } from '@/components/community/VideoThumb';

const MAX_PROMO = 500; // convex/companyProfile.ts MAX_PROMO_PHOTOS (safety cap only, not shown)
const ROOM_PREVIEW = 12;

const card = 'bg-brand-surface rounded-2xl border border-white/5 p-5 sm:p-6';

/** Upload one image file to Convex storage, returns its storageId. */
function useUpload() {
  const generateUploadUrl = useCompanyMutation(api.companies.generateUploadUrl);
  return async (file: File): Promise<string> => {
    const url = await generateUploadUrl({});
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    if (!res.ok) throw new Error('Upload failed');
    const { storageId } = await res.json();
    return storageId;
  };
}

/**
 * The company's own profile: logo, details, promo photos and which team photos
 * show on its public page (companies/[id] on the site).
 */
export default function CompanyProfilePage() {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const companyId = company?.id;
  const data = useCompanyQuery(api.companyProfile.forPortal, companyId ? { companyId: companyId as any } : 'skip');
  const publicUrl = useMainSiteUrl(companyId ? `/companies/${companyId}` : '/');

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Store className="w-7 h-7 text-brand-red-light" /> {t('cp.title')}
          </h1>
          <p className="text-brand-text-secondary mt-1 text-sm max-w-xl">{t('cp.subtitle')}</p>
        </div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm py-2! inline-flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> {t('cp.view_public')}
        </a>
      </div>

      {/* Cover + logo, laid out like the public profile */}
      <ProfileHeaderEditor
        name={data?.name ?? company?.name ?? ''}
        city={data?.city ?? ''}
        logo={data?.logo ?? ''}
        cover={data?.cover ?? ''}
      />

      <section className={card}>
        <h2 className="text-lg font-bold mb-5">{t('cp.details')}</h2>
        <CompanyInfoForm />
      </section>

      {data === undefined ? (
        <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-brand-red" /></div>
      ) : (
        <>
          <PromoPhotos photos={data.promo} />
          {/* Team photos hidden for now: */}
          {/* <TeamPhotos groups={data.team} /> */}
        </>
      )}
    </div>
  );
}

/** Pick an image file, upload it, and save it with `save(storageId)`. */
function useImagePicker(save: (storageId?: string) => Promise<unknown>) {
  const { t } = useTranslation();
  const toast = useToast();
  const upload = useUpload();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const run = async (file?: File) => {
    setBusy(true);
    try {
      await save(file ? await upload(file) : undefined);
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t, 'company.settings.profile_error') });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };
  const input = (
    <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
  );
  return { busy, pick: () => ref.current?.click(), remove: () => run(), input };
}

/** The top of the public profile, editable in place: cover photo and logo. */
function ProfileHeaderEditor({ name, city, logo, cover }: { name: string; city: string; logo: string; cover: string }) {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const setCover = useCompanyMutation(api.companyProfile.setCover);
  const setLogo = useCompanyMutation(api.companyProfile.setLogo);
  const coverPicker = useImagePicker((storageId) => setCover({ companyId: company!.id as any, storageId: storageId as any }));
  const logoPicker = useImagePicker((storageId) => setLogo({ companyId: company!.id as any, storageId: storageId as any }));
  const logoOk = logo && /^https?:\/\//.test(logo);
  const overlayBtn = 'inline-flex items-center gap-1.5 rounded-lg bg-black/65 hover:bg-black/85 backdrop-blur-sm text-white text-xs sm:text-sm font-medium px-3 py-1.5 disabled:opacity-50';

  return (
    <section className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
      {/* Cover */}
      <div className="relative h-36 sm:h-52 bg-linear-to-br from-brand-red/40 via-black to-brand-dark">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        {coverPicker.busy && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {cover && (
            <button type="button" onClick={coverPicker.remove} disabled={coverPicker.busy} className={overlayBtn} aria-label={t('cp.logo_remove')} title={t('cp.logo_remove')}>
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={coverPicker.pick} disabled={coverPicker.busy} className={overlayBtn}>
            <ImagePlus className="w-4 h-4" /> {cover ? t('cp.cover_change') : t('cp.cover_upload')}
          </button>
        </div>
        {coverPicker.input}
      </div>

      {/* Logo + name */}
      <div className="px-5 sm:px-6 pb-5 -mt-12 sm:-mt-14 relative flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
          <div className="w-full h-full rounded-full border-4 border-brand-surface bg-brand-bg overflow-hidden flex items-center justify-center">
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-display font-bold text-brand-red-light">{(name || '?').charAt(0).toUpperCase()}</span>
            )}
            {logoPicker.busy && (
              <span className="absolute inset-1 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={logoPicker.pick}
            disabled={logoPicker.busy}
            className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-brand-red text-white border-2 border-brand-surface flex items-center justify-center hover:bg-brand-red-light transition-colors"
            aria-label={logo ? t('cp.logo_change') : t('cp.logo_upload')}
            title={logo ? t('cp.logo_change') : t('cp.logo_upload')}
          >
            <Camera className="w-4 h-4" />
          </button>
          {logoPicker.input}
        </div>
        <div className="min-w-0 flex-1 sm:pb-1">
          <p className="text-xl sm:text-2xl font-display font-bold text-brand-bone truncate">{name}</p>
          {city && <p className="text-sm text-brand-text-secondary">{city}</p>}
        </div>
      </div>
      <div className="border-t border-white/5 px-5 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-secondary">
        <span>{t('cp.cover_hint')}</span>
        <span>{t('cp.logo_hint')}</span>
        {logo && (
          <button type="button" onClick={logoPicker.remove} disabled={logoPicker.busy} className="text-brand-text-secondary hover:text-red-400 underline-offset-2 hover:underline">
            {t('cp.logo_remove_full')}
          </button>
        )}
      </div>
    </section>
  );
}

function PromoPhotos({ photos }: { photos: { _id: string; url: string; type: 'image' | 'video' }[] }) {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const upload = useUpload();
  const addPromo = useCompanyMutation(api.companyProfile.addPromo);
  const removePromo = useCompanyMutation(api.companyProfile.removePromo);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const full = photos.length >= MAX_PROMO;

  const pick = async (files: FileList | null) => {
    if (!files || !company) return;
    const list = Array.from(files).slice(0, MAX_PROMO - photos.length);
    setUploading(list.length);
    for (const file of list) {
      try {
        const storageId = await upload(file);
        await addPromo({ companyId: company.id as any, storageId: storageId as any });
      } catch (err) {
        toast({ kind: 'error', message: friendlyError(err, t, 'company.settings.profile_error') });
      }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async (id: string) => {
    if (!company || !confirm(t('cp.delete_confirm'))) return;
    try {
      await removePromo({ companyId: company.id as any, photoId: id as any });
    } catch (err) {
      toast({ kind: 'error', message: friendlyError(err, t, 'company.settings.profile_error') });
    }
  };

  return (
    <section className={card}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ImagePlus className="w-5 h-5 text-brand-red-light" /> {t('cp.promo_title')}</h2>
          <p className="text-sm text-brand-text-secondary mt-1">{t('cp.promo_desc')}</p>
        </div>
        <span className="text-xs text-brand-text-secondary shrink-0">{photos.length}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p, i) => (
          <div key={p._id} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border border-white/5">
            <button type="button" onClick={() => setViewing(i)} className="w-full h-full cursor-zoom-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.type === 'video' ? <VideoThumb url={p.url} /> : <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </button>
            <button
              type="button"
              onClick={() => remove(p._id)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center"
              aria-label={t('cp.delete_photo')}
              title={t('cp.delete_photo')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="aspect-[4/3] rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-red-light" />
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading > 0}
            className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/15 hover:border-brand-red/50 text-brand-text-secondary hover:text-white flex flex-col items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <ImagePlus className="w-6 h-6" />
            {uploading > 0 ? t('cp.uploading') : t('cp.promo_add_media')}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      {viewing !== null && <PhotoViewer urls={photos.map((p) => p.url)} types={photos.map((p) => p.type)} start={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}

type TeamGroup = {
  roomId: string;
  roomTitle: string;
  photos: { _id: string; url: string; teamName: string; onProfile: boolean }[];
};

/** Team photos, one block per room of the company (new rooms show up empty). */
function TeamPhotos({ groups }: { groups: TeamGroup[] }) {
  const { t } = useTranslation();
  const p = useCompanyPath();

  return (
    <section className={card}>
      <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-brand-red-light" /> {t('cp.team_title')}</h2>
      <p className="text-sm text-brand-text-secondary mt-1">{t('cp.team_desc')}</p>
      <p className="text-xs text-amber-300/90 mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-px" /> {t('cp.team_consent')}
      </p>

      {groups.length === 0 ? (
        <div className="text-center py-10">
          <DoorOpen className="w-8 h-8 mx-auto text-brand-text-muted mb-3" />
          <p className="text-sm text-brand-text-secondary mb-4">{t('cp.team_no_rooms')}</p>
          <Link href={p('/company/rooms/new')} className="btn-ghost text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('cp.add_room')}
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/5 mt-2">
          {groups.map((g) => <TeamRoom key={g.roomId || 'none'} group={g} />)}
        </div>
      )}
    </section>
  );
}

function TeamRoom({ group }: { group: TeamGroup }) {
  const { company } = useCompanyAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const upload = useUpload();
  const setOnProfile = useCompanyMutation(api.companyProfile.setTeamPhotoOnProfile);
  const addTeamPhoto = useCompanyMutation(api.companyProfile.addTeamPhoto);
  const setTeamName = useCompanyMutation(api.companyProfile.setTeamName);
  const deletePhoto = useCompanyMutation(api.standalonePhotos.deletePhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const shown = group.photos.filter((ph) => ph.onProfile).length;
  const list = all ? group.photos : group.photos.slice(0, ROOM_PREVIEW);
  const cid = company?.id as any;

  const fail = (err: unknown) => toast({ kind: 'error', message: friendlyError(err, t, 'company.settings.profile_error') });

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id);
    try { await fn(); } catch (err) { fail(err); } finally { setBusy(null); }
  };

  const pick = async (files: FileList | null) => {
    if (!files || !company || !group.roomId) return;
    const list = Array.from(files);
    setUploading(list.length);
    for (const file of list) {
      try {
        const storageId = await upload(file);
        await addTeamPhoto({ companyId: cid, roomId: group.roomId as any, storageId: storageId as any });
      } catch (err) {
        fail(err);
      }
      setUploading((n) => n - 1);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const rename = (id: string, current: string) => {
    const name = prompt(t('cp.team_name_prompt'), current);
    if (name === null) return;
    act(id, () => setTeamName({ companyId: cid, photoId: id as any, teamName: name }));
  };

  const remove = (id: string) => {
    if (!confirm(t('cp.delete_confirm'))) return;
    act(id, () => deletePhoto({ companyId: cid, photoId: id as any }));
  };

  const iconBtn = 'w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center';

  return (
    <div className="py-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{group.roomTitle || t('cp.no_room')}</h3>
          <p className="text-xs text-brand-text-secondary">
            {t('cp.shown_count', { n: String(shown), total: String(group.photos.length) })}
          </p>
        </div>
        {group.roomId && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading > 0}
            className="btn-ghost text-sm py-2! inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {uploading > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {uploading > 0 ? t('cp.uploading') : t('cp.promo_add')}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      </div>

      {group.photos.length === 0 && uploading === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-white/10 hover:border-brand-red/40 text-brand-text-secondary hover:text-white py-8 flex flex-col items-center gap-2 text-sm"
        >
          <Camera className="w-6 h-6" /> {t('cp.room_empty')}
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {list.map((ph) => (
            <div
              key={ph._id}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border-2 transition-colors ${
                ph.onProfile ? 'border-brand-red' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.teamName} className={`w-full h-full object-cover ${ph.onProfile ? '' : 'opacity-60'}`} loading="lazy" />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button type="button" onClick={() => rename(ph._id, ph.teamName)} className={iconBtn} aria-label={t('cp.team_name')} title={t('cp.team_name')}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => remove(ph._id)} className={`${iconBtn} hover:bg-red-600!`} aria-label={t('cp.delete_photo')} title={t('cp.delete_photo')}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {ph.teamName && (
                <span className="absolute top-2 left-2 right-20 text-[11px] text-white bg-black/60 rounded px-1.5 py-0.5 truncate">{ph.teamName}</span>
              )}
              <button
                type="button"
                onClick={() => act(ph._id, () => setOnProfile({ companyId: cid, photoId: ph._id as any, onProfile: !ph.onProfile }))}
                disabled={busy === ph._id}
                aria-pressed={ph.onProfile}
                className={`absolute bottom-2 left-2 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  ph.onProfile ? 'bg-brand-red text-white' : 'bg-black/75 text-white/85 hover:bg-black/90'
                }`}
              >
                {busy === ph._id ? <Loader2 className="w-3 h-3 animate-spin" /> : ph.onProfile ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {ph.onProfile ? t('cp.on_profile') : t('cp.hidden')}
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`u${i}`} className="aspect-[4/3] rounded-xl bg-black/40 border border-white/5 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-red-light" />
            </div>
          ))}
        </div>
      )}
      {group.photos.length > ROOM_PREVIEW && (
        <button type="button" onClick={() => setAll(!all)} className="text-sm text-brand-red-light hover:underline mt-3">
          {all ? t('cp.show_less') : t('cp.show_all', { n: String(group.photos.length) })}
        </button>
      )}
    </div>
  );
}

