/**
 * Convex API hooks for the UNLOCKED web app.
 * These hooks connect to the same Convex backend used by the mobile app.
 * 
 * Usage:
 * 1. Set NEXT_PUBLIC_CONVEX_URL in your .env.local file
 * 2. Import hooks from this file
 * 3. Use inside components wrapped by ConvexClientProvider
 * 
 * Note: These hooks require the Convex client to be initialized.
 * When NEXT_PUBLIC_CONVEX_URL is not set, the app runs in "demo mode"
 * with sample data.
 */

import { useQuery, useMutation } from 'convex/react';

// ============================================================
// Type definitions matching the Convex schema
// ============================================================

export interface Room {
  _id: string;
  title: string;
  location: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  duration: string;
  difficulty: number;
  maxDifficulty: number;
  players: string;
  playersMin: number;
  playersMax: number;
  price: number;
  pricePerGroup?: Array<{ players: number; totalPrice: number }>;
  theme: string;
  tags: string[];
  description: string;
  story: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  companyId?: string;
  paymentTerms?: string | string[];
  termsOfUse?: string;
  isSubscriptionOnly?: boolean;
  isActive?: boolean;
  bookingMode?: 'unlocked_primary' | 'external_primary';
  latitude?: number;
  longitude?: number;
  operatingDays?: number[];
  defaultTimeSlots?: string[];
  overflowSlot?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  title: string;
  memberSince: string;
  played: number;
  escaped: number;
  awards: number;
  wishlist: string[];
  city?: string;
  isAdmin?: boolean;
}

export interface Company {
  _id: string;
  name: string;
  email: string;
  phone: string;
  logo: string;
  address: string;
  city: string;
  description: string;
  verified: boolean;
  onboardingStatus?: 'pending_terms' | 'pending_plan' | 'pending_review' | 'approved' | 'declined';
  platformPlan?: 'starter' | 'pro' | 'enterprise';
}

export interface Booking {
  _id: string;
  userId?: string;
  roomId: string;
  date: string;
  time: string;
  players: number;
  total: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending_payment';
  bookingCode: string;
  createdAt: number;
  depositPaid?: number;
  paymentTerms?: string;
  source?: 'unlocked' | 'external';
  paymentStatus?: 'paid' | 'deposit' | 'unpaid' | 'na';
}

export interface TimeSlot {
  _id: string;
  roomId: string;
  date: string;
  time: string;
  available: boolean;
  price: number;
  pricePerGroup?: Array<{ players: number; totalPrice: number }>;
}

export interface Badge {
  _id: string;
  userId: string;
  title: string;
  icon: string;
  earned: boolean;
  date?: string;
}

export interface Post {
  _id: string;
  authorType: 'user' | 'company';
  authorUserId?: string;
  authorCompanyId?: string;
  text: string;
  media: Array<{ type: string; url: string; storageId?: string }>;
  roomId?: string;
  rating?: number;
  likes: number;
  createdAt: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'booking' | 'cancelled' | 'reminder' | 'promo' | 'system' | 'slot_available';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}

// ============================================================
// Hook factory — wraps Convex useQuery/useMutation with
// type safety once the Convex generated API is available.
// For now, provides the types and structure for integration.
// ============================================================

/**
 * To connect these hooks to your Convex backend:
 * 
 * 1. Copy the `convex/` folder from your escape-app project
 * 2. Run `npx convex dev` to generate types
 * 3. Uncomment the imports below and replace the placeholder hooks
 * 
 * Example:
 * ```ts
 * import { api } from '../../convex/_generated/api';
 * 
 * export function useRooms() {
 *   return useQuery(api.rooms.list);
 * }
 * ```
 */

// Placeholder hook types for IDE support before Convex setup
export type ConvexHookResult<T> = T | undefined;
