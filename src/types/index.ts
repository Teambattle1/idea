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

export const COUNTRIES: Record<string, { label: string; flag: string }> = {
  '': { label: 'Vælg land', flag: '' },
  DK: { label: 'Danmark', flag: '🇩🇰' },
  SE: { label: 'Sverige', flag: '🇸🇪' },
  NO: { label: 'Norge', flag: '🇳🇴' },
  DE: { label: 'Tyskland', flag: '🇩🇪' },
  BE: { label: 'Belgien', flag: '🇧🇪' },
  RO: { label: 'Rumænien', flag: '🇷🇴' },
  PT: { label: 'Portugal', flag: '🇵🇹' },
  IL: { label: 'Israel', flag: '🇮🇱' },
  CZ: { label: 'Tjekkiet', flag: '🇨🇿' },
  GR: { label: 'Grækenland', flag: '🇬🇷' },
  GB: { label: 'England', flag: '🇬🇧' },
  US: { label: 'USA', flag: '🇺🇸' },
  NL: { label: 'Holland', flag: '🇳🇱' },
  FR: { label: 'Frankrig', flag: '🇫🇷' },
  ES: { label: 'Spanien', flag: '🇪🇸' },
  IT: { label: 'Italien', flag: '🇮🇹' },
};

export interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
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
  let: 'Let',
  medium: 'Medium',
  svær: 'Svær',
};

export const LOCATION_LABELS: Record<Activity['location'], string> = {
  indendørs: 'Indendørs',
  udendørs: 'Udendørs',
  begge: 'Begge dele',
};

export const DURATION_RANGES = [
  { label: 'Alle', min: 0, max: Infinity },
  { label: '0-15 min', min: 0, max: 15 },
  { label: '15-30 min', min: 15, max: 30 },
  { label: '30-60 min', min: 30, max: 60 },
  { label: '60+ min', min: 60, max: Infinity },
];

export const SUGGESTED_TAGS = [
  'icebreaker',
  'teamwork',
  'kommunikation',
  'kreativitet',
  'strategi',
  'tillid',
  'energizer',
  'refleksion',
  'konkurrence',
  'samarbejde',
  'problemløsning',
  'sjov',
];
