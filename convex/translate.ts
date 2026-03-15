import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const SUPPORTED_LANGUAGES = ["en", "el", "nl"] as const;

// Language pair codes for MyMemory API
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
    // MyMemory returns UNTRANSLATED TEXT IN CAPS when it can't translate
    if (translated === text.toUpperCase()) return null;
    return translated;
  }
  return null;
}

// Internal mutation to save translations back to the room
export const saveTranslations = internalMutation({
  args: {
    roomId: v.id("rooms"),
    storyTranslations: v.optional(
      v.object({
        en: v.optional(v.string()),
        el: v.optional(v.string()),
        nl: v.optional(v.string()),
      })
    ),
    descriptionTranslations: v.optional(
      v.object({
        en: v.optional(v.string()),
        el: v.optional(v.string()),
        nl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { roomId, ...translations } = args;
    const updates: Record<string, unknown> = {};
    if (translations.storyTranslations)
      updates.storyTranslations = translations.storyTranslations;
    if (translations.descriptionTranslations)
      updates.descriptionTranslations = translations.descriptionTranslations;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(roomId, updates);
    }
  },
});

// Action: auto-translate a room's story & description
// sourceLang is the language the original text is in (defaults to "en")
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

    // Translate story and description to each target language
    for (const lang of targetLangs) {
      const [translatedStory, translatedDesc] = await Promise.all([
        translateText(story, sourceLang, lang),
        translateText(description, sourceLang, lang),
      ]);
      if (translatedStory) storyTranslations[lang] = translatedStory;
      if (translatedDesc) descriptionTranslations[lang] = translatedDesc;
    }

    // Also copy the source text into translations so all languages are filled
    storyTranslations[sourceLang] = story;
    descriptionTranslations[sourceLang] = description;

    // Save via internal mutation
    await ctx.runMutation(internal.translate.saveTranslations, {
      roomId,
      storyTranslations: storyTranslations as any,
      descriptionTranslations: descriptionTranslations as any,
    });

    return { storyTranslations, descriptionTranslations };
  },
});
