const SUPPORTED_LANGUAGES = ['en', 'el', 'nl'] as const;

async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string | null> {
  if (!text.trim()) return null;
  if (from === to) return null;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;

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

export async function translateRoom(
  story: string,
  description: string,
  sourceLang: string
): Promise<{
  storyTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
}> {
  const targetLangs = SUPPORTED_LANGUAGES.filter((l) => l !== sourceLang);

  const storyTranslations: Record<string, string> = { [sourceLang]: story };
  const descriptionTranslations: Record<string, string> = { [sourceLang]: description };

  for (const lang of targetLangs) {
    const [translatedStory, translatedDesc] = await Promise.all([
      translateText(story, sourceLang, lang),
      translateText(description, sourceLang, lang),
    ]);
    if (translatedStory) storyTranslations[lang] = translatedStory;
    if (translatedDesc) descriptionTranslations[lang] = translatedDesc;
  }

  return { storyTranslations, descriptionTranslations };
}
