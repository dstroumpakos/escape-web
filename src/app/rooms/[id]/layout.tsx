import type { Metadata } from 'next';

// The room page itself is a client component; this layout gives every room its
// own title, description, canonical URL and share preview (Viber, Facebook, Google).
type MetaRoom = {
  title: string;
  description?: string;
  location?: string;
  image?: string;
  companyName?: string;
  photosOnly?: boolean;
  isActive?: boolean;
};

async function getRoom(id: string): Promise<MetaRoom | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl || !/^[a-z0-9]{20,40}$/.test(id)) return null;
  try {
    const res = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'rooms:getById', args: { id }, format: 'json' }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === 'success' && data.value ? (data.value as MetaRoom) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const url = `https://unlocked.gr/rooms/${id}`;
  const room = await getRoom(id);
  if (!room) return { alternates: { canonical: url } };
  const where = [room.companyName, room.location].filter(Boolean).join(', ');
  const title = `${room.title}${where ? ` · ${where}` : ''} | UNLOCKED`;
  const text = (room.description || '').replace(/\s+/g, ' ').trim();
  const description = (text.length > 155 ? text.slice(0, 152).trimEnd() + '…' : text) ||
    `Escape room ${room.title}${where ? ` (${where})` : ''}. Δες φωτογραφίες, κριτικές παικτών και μάζεψε τη σφραγίδα του στο UNLOCKED.`;
  const images = room.image && /^https:\/\//.test(room.image) ? [{ url: room.image, alt: room.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: room.photosOnly || room.isActive === false ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, type: 'website', siteName: 'UNLOCKED', images },
    twitter: { card: 'summary_large_image', title, description, images: images?.map((i) => i.url) },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
