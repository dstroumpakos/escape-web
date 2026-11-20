'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from '@/lib/i18n';
import { LEVEL_STYLE, LevelChip, type Level } from './levels';

type Pin = { id: string; title: string; company: string; lat: number; lng: number; level: string; roomId: string | null };

const icons = new Map<string, L.DivIcon>();
function iconFor(level: string): L.DivIcon {
  const key = level in LEVEL_STYLE ? level : 'declared';
  let icon = icons.get(key);
  if (!icon) {
    const color = LEVEL_STYLE[key as Level].dot;
    icon = L.divIcon({
      className: '',
      html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #120a08;box-shadow:0 0 0 2px ${color}66"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
    icons.set(key, icon);
  }
  return icon;
}

/** Every room I played that has a position: QR stamps and Rooms Played entries. */
export default function PlaysMap({ pins }: { pins: Pin[] }) {
  const { t } = useTranslation();
  const bounds = useMemo(() => (pins.length ? L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])).pad(0.3) : null), [pins]);

  if (!pins.length) {
    return <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-brand-text-secondary">{t('pl.map_empty')}</div>;
  }
  return (
    <div className="space-y-2">
      <div className="h-[420px] rounded-xl overflow-hidden border border-brand-border">
        <MapContainer
          bounds={bounds ?? undefined}
          boundsOptions={{ maxZoom: 13 }}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#120a08' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {pins.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={iconFor(p.level)}>
              <Popup>
                <div className="text-sm">
                  {p.roomId ? <Link href={`/rooms/${p.roomId}`} className="font-semibold">{p.title}</Link> : <strong>{p.title}</strong>}
                  {p.company && <div className="text-xs opacity-70">{p.company}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(['confirmed', 'verified', 'vouched', 'pending', 'declared'] as Level[]).map((l) => (
          <LevelChip key={l} level={l} small />
        ))}
      </div>
    </div>
  );
}
