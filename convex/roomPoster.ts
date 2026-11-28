import { v } from "convex/values";

/**
 * The room's card in the Companies section (schema rooms.posterImage): the
 * room photo cropped to the card's frame. Used by companies.createRoom /
 * updateRoom and managedCompanies.adminSaveRoom, so the company and the admin
 * save it the same way.
 */

/** Args: "" clears the crop (the card shows the room photo, centred). */
export const posterArgs = {
  posterImage: v.optional(v.string()),
};

/**
 * The value to store. Left undefined in the input = left out (nothing changes);
 * cleared = undefined, which a patch removes.
 */
export function posterFields(f: { posterImage?: string }) {
  const out: { posterImage?: string | undefined } = {};
  if (f.posterImage !== undefined) out.posterImage = f.posterImage.trim().slice(0, 1000) || undefined;
  return out;
}
