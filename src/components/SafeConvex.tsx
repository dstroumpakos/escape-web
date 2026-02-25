'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { ReactNode } from 'react';

/**
 * Wraps children in an error boundary that silently catches
 * Convex query / mutation errors so one failing query doesn't
 * crash the entire page.
 */
export function SafeConvex({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ErrorBoundary fallback={fallback ?? null}>
      {children}
    </ErrorBoundary>
  );
}
