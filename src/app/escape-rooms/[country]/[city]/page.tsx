import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCityBySlug, CITIES, getNearbyCities } from '@/data/cities';
import CityClient from './CityClient';

interface Props { params: Promise<{ country: string; city: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params;
  const data = getCityBySlug(country, city);
  if (!data) return {};
  return {
    title: `Best Escape Rooms in ${data.city}, ${data.country} (${new Date().getFullYear()}) | UNLOCKED`,
    description: `Discover ${data.roomCount}+ escape rooms in ${data.city}. Browse ${data.themes.slice(0, 3).join(', ')} themes, compare difficulty & prices from ${data.avgPrice}. Book instantly on UNLOCKED.`,
    alternates: { canonical: `https://unlocked.gr/escape-rooms/${country}/${city}` },
    openGraph: {
      title: `${data.roomCount}+ Escape Rooms in ${data.city} | UNLOCKED`,
      description: `Find the best escape rooms in ${data.city}, ${data.country}. Themes: ${data.themes.join(', ')}. Average rating: ${data.avgRating}/5.`,
      url: `https://unlocked.gr/escape-rooms/${country}/${city}`,
      siteName: 'UNLOCKED',
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return CITIES.map((c) => ({ country: c.countrySlug, city: c.citySlug }));
}

export default async function CityPage({ params }: Props) {
  const { country, city } = await params;
  const data = getCityBySlug(country, city);
  if (!data) return notFound();
  const nearby = getNearbyCities(data);
  return <CityClient city={data} nearby={nearby} />;
}
