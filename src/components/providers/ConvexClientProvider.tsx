'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ReactNode, useState, useEffect } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';

let convex: ConvexReactClient | null = null;

// Only create the client on the browser side to avoid SSR issues
if (typeof window !== 'undefined' && convexUrl) {
  try {
    convex = new ConvexReactClient(convexUrl);
  } catch (e) {
    console.error('Failed to create ConvexReactClient:', e);
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !convex) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
