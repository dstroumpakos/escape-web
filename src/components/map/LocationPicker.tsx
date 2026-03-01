'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';

// Fix Leaflet default icon issue in Next.js
if (typeof window !== 'undefined') {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

interface LocationPickerProps {
  location: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (location: string, lat: number, lng: number) => void;
  placeholder?: string;
  searchLabel?: string;
  pinHint?: string;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterUpdater({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function LocationPicker({
  location,
  latitude,
  longitude,
  onLocationChange,
  placeholder = 'Search address...',
  searchLabel = 'Search',
  pinHint = 'Click on the map to place a pin, or search for an address',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode: lat/lng → address text
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=el,en`
        );
        const data = await res.json();
        if (data.display_name) {
          // Build a concise address
          const addr = data.address;
          const parts = [];
          if (addr.road) parts.push(addr.road + (addr.house_number ? ' ' + addr.house_number : ''));
          if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
          if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
          if (addr.postcode) parts.push(addr.postcode);
          const concise = parts.length > 0 ? parts.join(', ') : data.display_name;
          onLocationChange(concise, lat, lng);
        }
      } catch {
        // Fallback: just use coordinates
        onLocationChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng);
      }
    },
    [onLocationChange]
  );

  // Forward geocode: address text → lat/lng
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gr&accept-language=el,en`
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latN = parseFloat(lat);
        const lngN = parseFloat(lon);
        setMarkerPos([latN, lngN]);
        setFlyTo([latN, lngN]);
        // Now reverse geocode for a structured address
        await reverseGeocode(latN, lngN);
      }
    } catch {
      // Silent fail
    } finally {
      setSearching(false);
    }
  }, [reverseGeocode]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleSearch = () => {
    searchAddress(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch();
    }
  };

  // Default center: Athens, Greece
  const defaultCenter: [number, number] = latitude && longitude
    ? [latitude, longitude]
    : [37.9838, 23.7275];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-brand-bg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-brand-text-secondary/50 focus:border-brand-red focus:outline-none transition-colors text-sm"
            placeholder={placeholder}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="px-4 py-3 bg-brand-red hover:bg-brand-red/90 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {searchLabel}
        </button>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 300 }}>
        <MapContainer
          center={defaultCenter}
          zoom={latitude && longitude ? 15 : 12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          {flyTo && <MapCenterUpdater center={flyTo} />}
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>
      </div>

      {/* Hint / resolved address */}
      {location ? (
        <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-emerald-300">{location}</p>
        </div>
      ) : (
        <p className="text-xs text-brand-text-secondary flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {pinHint}
        </p>
      )}
    </div>
  );
}
