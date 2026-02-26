'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { MapPin, Star, Clock } from 'lucide-react';

// Fix Leaflet default icon issue in Next.js
if (typeof window !== 'undefined') {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

const RADIUS_KM = 10;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapView() {
  const { t } = useTranslation();
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocLoading(false);
        }
      );
    } else {
      setLocLoading(false);
    }
  }, []);

  const allRooms = useQuery(api.rooms.list);

  const nearbyRooms = useMemo(() => {
    if (!allRooms) return [];
    if (!userLoc) return allRooms.filter((r: any) => r.latitude && r.longitude);
    return allRooms.filter((r: any) => {
      if (!r.latitude || !r.longitude) return false;
      return distanceKm(userLoc.latitude, userLoc.longitude, r.latitude, r.longitude) <= RADIUS_KM;
    });
  }, [allRooms, userLoc]);

  const defaultCenter: [number, number] = useMemo(() => {
    if (userLoc) return [userLoc.latitude, userLoc.longitude];
    const first = nearbyRooms[0];
    if (first?.latitude && first?.longitude) return [first.latitude, first.longitude];
    // Fallback: Athens, Greece
    return [37.9838, 23.7275];
  }, [userLoc, nearbyRooms]);

  if (locLoading || allRooms === undefined) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={defaultCenter} />
        
        {userLoc && (
          <Marker position={[userLoc.latitude, userLoc.longitude]}>
            <Popup>
              <div className="font-semibold text-white p-2">{t('map.you_are_here')}</div>
            </Popup>
          </Marker>
        )}

        {nearbyRooms.map((room: any) => (
          <Marker key={room._id} position={[room.latitude, room.longitude]}>
            <Popup className="custom-popup">
              <div className="w-48">
                <div className="h-24 w-full relative rounded-t-lg overflow-hidden mb-2">
                  <img
                    src={room.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80'}
                    alt={room.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="px-3 pb-3">
                  <h3 className="font-bold text-white text-sm mb-1 truncate">{room.title}</h3>
                  <div className="flex items-center text-xs text-brand-text-secondary mb-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{room.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-brand-text-secondary mb-3">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 mr-1" />
                      <span>{room.rating?.toFixed(1) || t('map.new_rating')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{room.duration}m</span>
                    </div>
                  </div>
                  <Link
                    href={`/rooms/${room._id}`}
                    className="block w-full text-center bg-brand-red text-white py-1.5 rounded text-xs font-medium hover:bg-brand-red-hover transition-colors"
                  >
                    {t('map.view_details')}
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
