// Simple language detection based on URL TLD and common words

const TLD_LANG_MAP: Record<string, string> = {
  '.dk': 'da',
  '.se': 'sv',
  '.no': 'no',
  '.de': 'de',
  '.at': 'de',
  '.ch': 'de',
  '.be': 'nl',
  '.nl': 'nl',
  '.ro': 'ro',
  '.pt': 'pt',
  '.br': 'pt',
  '.il': 'he',
  '.cz': 'cs',
  '.gr': 'el',
  '.fr': 'fr',
  '.es': 'es',
  '.it': 'it',
  '.uk': 'en',
  '.com': 'en',
  '.org': 'en',
  '.io': 'en',
};

const LANG_KEYWORDS: Record<string, string[]> = {
  da: ['og', 'til', 'med', 'aktivitet', 'holdning', 'varighed', 'personer', 'indendørs', 'udendørs'],
  sv: ['och', 'för', 'med', 'aktivitet', 'personer', 'inomhus', 'utomhus', 'lagbyggnad', 'tävling'],
  no: ['og', 'for', 'med', 'aktivitet', 'personer', 'innendørs', 'utendørs'],
  de: ['und', 'für', 'mit', 'aktivität', 'personen', 'drinnen', 'draußen', 'teambuilding'],
  nl: ['en', 'voor', 'met', 'activiteit', 'personen', 'binnen', 'buiten'],
  fr: ['et', 'pour', 'avec', 'activité', 'personnes', 'intérieur', 'extérieur'],
  es: ['y', 'para', 'con', 'actividad', 'personas', 'interior', 'exterior'],
  pt: ['e', 'para', 'com', 'atividade', 'pessoas', 'interior', 'exterior'],
  it: ['e', 'per', 'con', 'attività', 'persone', 'interno', 'esterno'],
};

export function detectLanguageFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    for (const [tld, lang] of Object.entries(TLD_LANG_MAP)) {
      if (hostname.endsWith(tld)) return lang;
    }
  } catch {}
  return 'en';
}

export function detectLanguageFromText(text: string): string {
  if (!text || text.length < 20) return 'en';

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const scores: Record<string, number> = {};

  for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
    scores[lang] = 0;
    for (const kw of keywords) {
      if (words.includes(kw)) scores[lang]++;
    }
  }

  let bestLang = 'en';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestScore >= 2 ? bestLang : 'en';
}

export function detectLanguage(url: string, text: string): string {
  // URL TLD is most reliable
  const urlLang = detectLanguageFromUrl(url);
  if (urlLang !== 'en') return urlLang;

  // Fall back to text analysis
  return detectLanguageFromText(text);
}
