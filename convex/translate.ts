"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const SUPPORTED_LANGUAGES = ["en", "el", "nl"] as const;

const LANG_CODES: Record<string, string> = {
  en: "en",
  el: "el",
  nl: "nl",
};

async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string | null> {
  if (!text.trim()) return null;
  const fromCode = LANG_CODES[from];
  const toCode = LANG_CODES[to];
  if (!fromCode || !toCode || fromCode === toCode) return null;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
    const translated = data.responseData.translatedText;
    if (translated === text.toUpperCase()) return null;
    return translated;
  }
  return null;
}

export const autoTranslateRoom = action({
  args: {
    roomId: v.id("rooms"),
    story: v.string(),
    description: v.string(),
    sourceLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { roomId, story, description } = args;
    const sourceLang = args.sourceLang || "en";

    const targetLangs = SUPPORTED_LANGUAGES.filter((l) => l !== sourceLang);

    const storyTranslations: Record<string, string> = {};
    const descriptionTranslations: Record<string, string> = {};

    for (const lang of targetLangs) {
      const [translatedStory, translatedDesc] = await Promise.all([
        translateText(story, sourceLang, lang),
        translateText(description, sourceLang, lang),
      ]);
      if (translatedStory) storyTranslations[lang] = translatedStory;
      if (translatedDesc) descriptionTranslations[lang] = translatedDesc;
    }

    storyTranslations[sourceLang] = story;
    descriptionTranslations[sourceLang] = description;

    await ctx.runMutation(internal.translateHelpers.saveTranslations, {
      roomId,
      storyTranslations: storyTranslations as any,
      descriptionTranslations: descriptionTranslations as any,
    });

    return { storyTranslations, descriptionTranslations };
  },
});
