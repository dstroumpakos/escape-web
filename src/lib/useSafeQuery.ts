'use client';

import { useQuery } from 'convex/react';
import { FunctionReference } from 'convex/server';

/**
 * A safe wrapper around Convex useQuery that catches errors
 * and returns undefined instead of throwing.
 * 
 * This prevents a single failing Convex query from crashing
 * the entire React tree.
 */
export function useSafeQuery<T>(
  query: FunctionReference<'query'>,
  args?: Record<string, unknown>
): T | undefined {
  try {
    const result = useQuery(query, args ?? {});
    return result as T | undefined;
  } catch (error) {
    console.warn('[useSafeQuery] Query failed:', error);
    return undefined;
  }
}
