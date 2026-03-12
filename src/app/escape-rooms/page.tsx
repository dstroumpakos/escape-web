import { Metadata } from 'next';
import { CITIES, getCountries } from '@/data/cities';
import DirectoryClient from './DirectoryClient';

export const metadata: Metadata = {
  title: 'Escape Rooms Around the World – Browse by Country & City | UNLOCKED',
  description:
    'Explore escape rooms in 50+ cities across Europe, North America, Asia & Oceania. Find rooms by country, read tips, and book your next adventure on UNLOCKED.',
  alternates: { canonical: 'https://unlocked.gr/escape-rooms' },
};

export default function EscapeRoomsDirectoryPage() {
  const countries = getCountries();
  const totalCities = CITIES.length;
  const totalRooms = CITIES.reduce((sum, c) => sum + c.roomCount, 0);

  return <DirectoryClient countries={countries} totalCities={totalCities} totalRooms={totalRooms} />;
}
