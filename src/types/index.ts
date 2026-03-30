export interface MaterialFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface CostItem {
  description: string;
  price: string;
}

export interface ContactInfo {
  company: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
}

export interface CompanyProfile {
  id: string;
  company: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  gameOwner: string;
  createdAt: string;
}

export const COUNTRIES: Record<string, { label: string; flag: string }> = {
  '': { label: 'Select country', flag: '' },
  DK: { label: 'Denmark', flag: '🇩🇰' },
  SE: { label: 'Sweden', flag: '🇸🇪' },
  NO: { label: 'Norway', flag: '🇳🇴' },
  DE: { label: 'Germany', flag: '🇩🇪' },
  BE: { label: 'Belgium', flag: '🇧🇪' },
  RO: { label: 'Romania', flag: '🇷🇴' },
  PT: { label: 'Portugal', flag: '🇵🇹' },
  IL: { label: 'Israel', flag: '🇮🇱' },
  CZ: { label: 'Czech Republic', flag: '🇨🇿' },
  GR: { label: 'Greece', flag: '🇬🇷' },
  GB: { label: 'United Kingdom', flag: '🇬🇧' },
  US: { label: 'USA', flag: '🇺🇸' },
  NL: { label: 'Netherlands', flag: '🇳🇱' },
  FR: { label: 'France', flag: '🇫🇷' },
  ES: { label: 'Spain', flag: '🇪🇸' },
  IT: { label: 'Italy', flag: '🇮🇹' },
};

export interface OriginalText {
  lang: string; // ISO 639-1 code e.g. 'da', 'de', 'pt'
  title: string;
  shortDescription: string;
  longDescription: string;
  execution: string;
}

export interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  execution: string;
  originalText: OriginalText | null;
  images: string[];
  links: ActivityLink[];
  materials: MaterialFile[];
  costs: CostItem[];
  contact: ContactInfo;
  youtubeUrl: string;
  videoUrl: string;
  tags: string[];
  duration: string;
  durationMinutes: number;
  groupSize: string;
  difficulty: 'let' | 'medium' | 'svær';
  location: 'indendørs' | 'udendørs' | 'begge';
  author: string;
  createdAt: string;
  archived: boolean;
}

export interface ActivityLink {
  label: string;
  url: string;
}

export type ViewState =
  | { page: 'home' }
  | { page: 'create-activity' }
  | { page: 'edit-activity'; id: string }
  | { page: 'activity-detail'; id: string };

export const DIFFICULTY_LABELS: Record<Activity['difficulty'], string> = {
  let: 'Easy',
  medium: 'Medium',
  svær: 'Hard',
};

export const LOCATION_LABELS: Record<Activity['location'], string> = {
  indendørs: 'Indoor',
  udendørs: 'Outdoor',
  begge: 'Both',
};

export const DURATION_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: '0-15 min', min: 0, max: 15 },
  { label: '15-30 min', min: 15, max: 30 },
  { label: '30-60 min', min: 30, max: 60 },
  { label: '60+ min', min: 60, max: Infinity },
];

export const SUGGESTED_TAGS = [
  'icebreaker',
  'teamwork',
  'communication',
  'creativity',
  'strategy',
  'trust',
  'energizer',
  'reflection',
  'competition',
  'collaboration',
  'problem-solving',
  'fun',
];
