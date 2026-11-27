import { ImageResponse } from 'next/og';
import { BrandIconTile } from '@/lib/brandIcon';

/**
 * Default share image (Facebook, WhatsApp, Viber, X, iMessage link previews)
 * for every page that does not set its own. Shows the full brand lockup
 * "UNLOCKED Escape Rooms" so a link alone tells people what the site is.
 */
export const alt = 'UNLOCKED Escape Rooms: every escape room, one app';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 38%, #3a0609 0%, #140304 45%, #080505 100%)',
          color: '#ece2d6',
          fontFamily: 'sans-serif',
        }}
      >
        <BrandIconTile size={150} />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 128, fontWeight: 800, letterSpacing: 10, lineHeight: 1 }}>
          <span>UN</span>
          <span style={{ color: '#ff3b47' }}>LOCKED</span>
        </div>
        <div style={{ display: 'flex', marginTop: 18, fontSize: 40, fontWeight: 700, letterSpacing: 22, color: '#ff3b47' }}>
          ESCAPE ROOMS
        </div>
        <div style={{ display: 'flex', marginTop: 44, fontSize: 34, color: '#c9bcae' }}>
          Every escape room. One app.
        </div>
        <div style={{ display: 'flex', position: 'absolute', bottom: 34, fontSize: 24, letterSpacing: 4, color: '#8a7d70' }}>
          unlocked.gr
        </div>
      </div>
    ),
    { ...size },
  );
}
