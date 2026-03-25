import { Activity } from '../types';

type PartialActivity = Partial<Omit<Activity, 'id' | 'createdAt' | 'archived'>>;

// Parse duration from text like "75-90 min", "60 minutter", "1,5 time", "30 min"
function extractDuration(text: string): { duration: string; durationMinutes: number } | null {
  const patterns = [
    /(\d+)\s*[-–]\s*(\d+)\s*min/i,
    /(\d+)\s*min(?:ut(?:ter)?)?/i,
    /(\d+[.,]\d+)\s*time/i,
    /(\d+)\s*time/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const avg = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        return { duration: `${match[1]}-${match[2]} min`, durationMinutes: avg };
      }
      if (pattern === patterns[2]) {
        const hours = parseFloat(match[1].replace(',', '.'));
        const mins = Math.round(hours * 60);
        return { duration: `${mins} min`, durationMinutes: mins };
      }
      if (pattern === patterns[3]) {
        const mins = parseInt(match[1]) * 60;
        return { duration: `${match[1]} time${parseInt(match[1]) > 1 ? 'r' : ''}`, durationMinutes: mins };
      }
      const mins = parseInt(match[1]);
      return { duration: `${mins} min`, durationMinutes: mins };
    }
  }
  return null;
}

// Parse group size from text like "4-72 people", "6 to 72", "3-4 personer", "teams of 3-4"
function extractGroupSize(text: string): string | null {
  const patterns = [
    /(\d+)\s*[-–]\s*(\d+)\s*(?:people|personer|pers|deltagere|participants)/i,
    /(?:from|fra)\s*(\d+)\s*(?:to|til)\s*(\d+)\s*(?:people|personer|pers|deltagere)?/i,
    /(?:groups?\s*(?:of|på|af)\s*)?(\d+)\s*[-–]\s*(\d+)\s*(?:people|personer|pers|per\s*team|pr\.?\s*team)?/i,
    /(?:up\s*to|op\s*til|max(?:imum)?)\s*(\d+)\s*(?:people|personer|pers|deltagere)/i,
    /(\d+)\s*(?:people|personer|pers|deltagere)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) return `${match[1]}-${match[2]}`;
      return match[1];
    }
  }
  return null;
}

// Detect location from text
function extractLocation(text: string): Activity['location'] | null {
  const lower = text.toLowerCase();
  const indoor = /\b(indoor|indendørs|indenfor|inside)\b/i.test(lower);
  const outdoor = /\b(outdoor|udendørs|udenfor|outside|summertime)\b/i.test(lower);

  if (indoor && outdoor) return 'begge';
  if (indoor) return 'indendørs';
  if (outdoor) return 'udendørs';
  return null;
}

// Detect difficulty from text
function extractDifficulty(text: string): Activity['difficulty'] | null {
  const lower = text.toLowerCase();
  if (/\b(svær|difficult|hard|challenging|advanced)\b/.test(lower)) return 'svær';
  if (/\b(let|easy|simple|beginner)\b/.test(lower)) return 'let';
  if (/\b(medium|moderat|intermediate)\b/.test(lower)) return 'medium';
  return null;
}

// Detect relevant tags from text
function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tagKeywords: Record<string, string[]> = {
    icebreaker: ['icebreaker', 'ice-breaker', 'is-bryder', 'get to know', 'lær hinanden'],
    teamwork: ['teamwork', 'team work', 'team-work', 'samarbejd', 'collaborate', 'collaboration', 'team'],
    kommunikation: ['kommunikation', 'communication', 'communicate', 'talk', 'dialog'],
    kreativitet: ['kreativ', 'creative', 'creativity', 'innovation', 'innovative'],
    strategi: ['strategi', 'strategy', 'strategic', 'tactical', 'taktisk'],
    tillid: ['tillid', 'trust', 'confidence'],
    energizer: ['energizer', 'energi', 'energy', 'active', 'aktiv'],
    refleksion: ['refleksion', 'reflection', 'reflect', 'debrief'],
    konkurrence: ['konkurrence', 'competition', 'compete', 'competing', 'versus', 'winning', 'race'],
    samarbejde: ['samarbejde', 'cooperat', 'collaborate', 'together', 'parallel task'],
    problemløsning: ['problemløsning', 'problem-solving', 'puzzle', 'solve', 'solution', 'challenge', 'escape room'],
    sjov: ['sjov', 'fun', 'entertaining', 'breathtaking', 'exciting'],
  };

  const found: string[] = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(tag);
    }
  }
  return found;
}

// Extract images from HTML
function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const images: string[] = [];

  // og:image
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/gi);
  if (ogMatch) {
    for (const m of ogMatch) {
      const urlMatch = m.match(/content=["']([^"']+)["']/);
      if (urlMatch) images.push(resolveUrl(urlMatch[1], baseUrl));
    }
  }

  // img src
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const m of imgMatches) {
    const src = m[1];
    if (src && !src.includes('data:') && !src.includes('pixel') && !src.includes('tracking')) {
      images.push(resolveUrl(src, baseUrl));
    }
  }

  // Dedupe and limit
  return [...new Set(images)].slice(0, 10);
}

function resolveUrl(url: string, base: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) {
    const origin = new URL(base).origin;
    return `${origin}${url}`;
  }
  return `${base.replace(/\/[^/]*$/, '/')}${url}`;
}

// Clean title: remove common prefixes like "Aktivitet - ", site names, etc.
function cleanTitle(title: string): string {
  let cleaned = title.trim();
  // Remove "Aktivitet - " or "Activity - " prefix
  cleaned = cleaned.replace(/^(Aktivitet|Activity)\s*[-–:]\s*/i, '');
  // Remove trailing " - SiteName" patterns (e.g. " - TeamBattle")
  cleaned = cleaned.replace(/\s*[-–|]\s*(?:TeamBattle|teambattle\.dk)$/i, '');
  return cleaned.trim();
}

// Extract title - first significant line of text
function extractTitle(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length > 0) {
    // Take the first short line as title (likely a heading)
    for (const line of lines) {
      if (line.length >= 3 && line.length <= 100) {
        return line;
      }
    }
    return lines[0].substring(0, 100);
  }
  return '';
}

// Main extraction function - takes raw text and returns partial activity
export function extractActivityFromText(text: string): PartialActivity {
  const result: PartialActivity = {};

  // Title
  result.title = cleanTitle(extractTitle(text));

  // Duration
  const duration = extractDuration(text);
  if (duration) {
    result.duration = duration.duration;
    result.durationMinutes = duration.durationMinutes;
  }

  // Group size
  const groupSize = extractGroupSize(text);
  if (groupSize) result.groupSize = groupSize;

  // Location
  const location = extractLocation(text);
  if (location) result.location = location;

  // Difficulty
  const difficulty = extractDifficulty(text);
  if (difficulty) result.difficulty = difficulty;

  // Tags
  const tags = extractTags(text);
  if (tags.length > 0) result.tags = tags;

  // Description - use full text minus the title
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const descLines = lines.filter((l) => l !== result.title);

  if (descLines.length > 0) {
    // Short description = first paragraph (up to 200 chars)
    result.shortDescription = descLines[0].substring(0, 200);

    // Long description = everything
    result.longDescription = descLines.join('\n');
  }

  return result;
}

// Parse HTML response from URL into activity data
export function extractActivityFromHtml(html: string, url: string): PartialActivity {
  const result: PartialActivity = {};

  // Extract meta title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
  result.title = cleanTitle(ogTitleMatch?.[1] || titleMatch?.[1]?.trim() || '');

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i);
  result.shortDescription = ogDescMatch?.[1] || descMatch?.[1] || '';

  // Extract body text (strip tags)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const bodyText = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Use body text for deeper extraction
    const textResult = extractActivityFromText(bodyText);

    // Merge - prefer meta tags for title/description, but use text parsing for structured data
    if (!result.title && textResult.title) result.title = textResult.title;
    if (textResult.duration) result.duration = textResult.duration;
    if (textResult.durationMinutes) result.durationMinutes = textResult.durationMinutes;
    if (textResult.groupSize) result.groupSize = textResult.groupSize;
    if (textResult.location) result.location = textResult.location;
    if (textResult.difficulty) result.difficulty = textResult.difficulty;
    if (textResult.tags && textResult.tags.length > 0) result.tags = textResult.tags;
    if (textResult.longDescription) result.longDescription = textResult.longDescription;
  }

  // Extract images
  const images = extractImagesFromHtml(html, url);
  if (images.length > 0) result.images = images;

  return result;
}
