'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    // Render without Convex in development when URL is not set
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
