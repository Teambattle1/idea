export interface TranslationLanguage {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: TranslationLanguage[] = [
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇧🇪' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
];

// Simple in-memory cache for translations
const cache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.substring(0, 50)}:${text.length}`;
}

export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<string> {
  if (!text.trim() || from === to) return text;

  const key = cacheKey(text, from, to);
  if (cache.has(key)) return cache.get(key)!;

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to }),
    });

    if (!response.ok) throw new Error('Translation failed');

    const data = await response.json();
    const translated = data.translatedText || text;
    cache.set(key, translated);
    return translated;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}

export interface TranslatedActivity {
  title: string;
  shortDescription: string;
  longDescription: string;
  execution: string;
}

export async function translateActivity(
  title: string,
  shortDescription: string,
  longDescription: string,
  execution: string,
  from: string,
  to: string
): Promise<TranslatedActivity> {
  if (from === to) {
    return { title, shortDescription, longDescription, execution };
  }

  const [tTitle, tShort, tLong, tExec] = await Promise.all([
    translateText(title, from, to),
    translateText(shortDescription, from, to),
    translateText(longDescription, from, to),
    translateText(execution, from, to),
  ]);

  return {
    title: tTitle,
    shortDescription: tShort,
    longDescription: tLong,
    execution: tExec,
  };
}
