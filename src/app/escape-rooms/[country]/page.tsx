import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCitiesByCountry, getCountries } from '@/data/cities';
import CountryClient from './CountryClient';

interface Props { params: Promise<{ country: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const cities = getCitiesByCountry(country);
  if (!cities.length) return {};
  const name = cities[0].country;
  const totalRooms = cities.reduce((s, c) => s + c.roomCount, 0);
  return {
    title: `Best Escape Rooms in ${name} – ${cities.length} Cities, ${totalRooms}+ Rooms | UNLOCKED`,
    description: `Explore ${totalRooms}+ escape rooms across ${cities.length} cities in ${name}. Compare themes, difficulty & prices. Book your next adventure on UNLOCKED.`,
    alternates: { canonical: `https://unlocked.gr/escape-rooms/${country}` },
  };
}

export function generateStaticParams() {
  return getCountries().map((c) => ({ country: c.countrySlug }));
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params;
  const cities = getCitiesByCountry(country);
  if (!cities.length) return notFound();
  const name = cities[0].country;
  const totalRooms = cities.reduce((s, c) => s + c.roomCount, 0);
  return <CountryClient countryName={name} countrySlug={country} cities={cities} totalRooms={totalRooms} />;
}
