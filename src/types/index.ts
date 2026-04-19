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
  address: string;
  city: string;
  zip: string;
  website: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes: string;
}

export interface CompanyProfile {
  id: string;
  company: string;
  country: string;
  address: string;
  city: string;
  zip: string;
  website: string;
  phone: string;
  whatsapp: string;
  email: string;
  notes: string;
  gameOwner: string;
  createdAt: string;
}

export interface AgencyContact {
  name: string;
  email: string;
  phone: string;
  note: string;
  whatsapp: string;
  teams: string;
  zoom: string;
  linkedin: string;
}

export interface Agency {
  id: string;
  name: string;
  logo: string;
  website: string;
  country: string;
  city: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactNote: string;
  contactWhatsapp: string;
  contactTeams: string;
  contactZoom: string;
  contactLinkedin: string;
  facebook: string;
  linkedin: string;
  instagram: string;
  additionalContacts: AgencyContact[];
  services: string[];
  tags: string[];
  badges: string[];
  notes: string;
  createdAt: string;
}

export interface EventContact {
  id: string;
  name: string;
  country: string;
  city: string;
  company: string;
  email: string;
  phone: string;
  note: string;
  createdAt: string;
}

// section is kun relevant for TRACK (teamaction) — splitter idéer i to lister.
// Default 'improvement' så gamle rows uden felt havner i den eksisterende liste.
export type ProjectIdeaSection = 'new' | 'improvement';

export interface ProjectIdea {
  id: string;
  projectSlug: string;
  title: string;
  url: string;
  note: string;
  section: ProjectIdeaSection;
  dueDate: string | null;
  createdAt: string;
}

export interface CustomProject {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface GameProject {
  slug: string;
  name: string;
  color: string;
  icon: string;
}

// Built-in projects mirror the 11 games on games.event.dk.
// icon = lucide-react icon name; color matches the games.event.dk palette.
export const GAME_PROJECTS: GameProject[] = [
  { slug: 'teamchallenge', name: 'Challenge', color: '#dc328c', icon: 'Trophy' },
  { slug: 'teamtaste', name: 'Taste', color: '#f5a623', icon: 'UtensilsCrossed' },
  { slug: 'teamlazer', name: 'Lazer', color: '#3b82f6', icon: 'Crosshair' },
  { slug: 'teamrobin', name: 'Robin', color: '#84cc16', icon: 'Leaf' },
  { slug: 'teamsegway', name: 'Segway', color: '#ef4444', icon: 'Bike' },
  { slug: 'teamconnect', name: 'Connect', color: '#a855f7', icon: 'Puzzle' },
  { slug: 'teambox', name: 'Box', color: '#15803d', icon: 'Package' },
  { slug: 'teamcontrol', name: 'Control', color: '#6b7280', icon: 'Gamepad2' },
  { slug: 'teamaction', name: 'Track', color: '#06b6d4', icon: 'Zap' },
  { slug: 'teamconstruct', name: 'Construct', color: '#eab308', icon: 'Wrench' },
  { slug: 'teamrace', name: 'Race', color: '#111827', icon: 'Flag' },
  { slug: 'play', name: 'Play', color: '#f97316', icon: 'Dices' },
];

export const CUSTOM_PROJECT_ICONS = [
  'Rocket',
  'Star',
  'Heart',
  'Flame',
  'Sparkles',
  'Target',
  'Gift',
  'Music',
  'Camera',
  'Map',
  'Users',
  'Briefcase',
];

export const CUSTOM_PROJECT_COLORS = [
  '#dc328c',
  '#f5a623',
  '#3b82f6',
  '#84cc16',
  '#ef4444',
  '#a855f7',
  '#15803d',
  '#06b6d4',
  '#eab308',
  '#111827',
];

export const AGENCY_SERVICES = [
  'Teambuilding',
  'Events',
  'Conferences',
  'Kick-off',
  'Leadership',
  'Travel',
  'Production',
  'Catering',
  'Venue',
  'AV / Tech',
];

// Badges are displayed under each agency card. Order here is also the
// display order on the card.
export const AGENCY_BADGES = ['PARTNER', 'LOQUIZ'] as const;
export type AgencyBadge = (typeof AGENCY_BADGES)[number];

export const AGENCY_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  PARTNER: {
    bg: 'bg-battle-orange/20',
    text: 'text-battle-orange',
    border: 'border-battle-orange/40',
  },
  LOQUIZ: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    border: 'border-blue-500/40',
  },
};

export const DIAL_CODES: Record<string, string> = {
  DK: '+45',
  SE: '+46',
  NO: '+47',
  DE: '+49',
  BE: '+32',
  RO: '+40',
  PT: '+351',
  IL: '+972',
  CZ: '+420',
  GR: '+30',
  GB: '+44',
  US: '+1',
  NL: '+31',
  FR: '+33',
  ES: '+34',
  IT: '+39',
  AT: '+43',
  BG: '+359',
  HR: '+385',
  CY: '+357',
  EE: '+372',
  FI: '+358',
  HU: '+36',
  IS: '+354',
  IE: '+353',
  LV: '+371',
  LT: '+370',
  LU: '+352',
  MT: '+356',
  PL: '+48',
  SK: '+421',
  SI: '+386',
  CH: '+41',
  UA: '+380',
  RS: '+381',
  AL: '+355',
  BA: '+387',
  MK: '+389',
  ME: '+382',
  MD: '+373',
  BY: '+375',
  XK: '+383',
  LI: '+423',
  MC: '+377',
  SM: '+378',
  AD: '+376',
  VA: '+39',
  AE: '+971',
  HK: '+852',
  TR: '+90',
};

export const COUNTRIES: Record<string, { label: string; flag: string }> = {
  '': { label: 'Select country', flag: '' },
  DK: { label: 'Denmark', flag: '🇩🇰' },
  SE: { label: 'Sweden', flag: '🇸🇪' },
  NO: { label: 'Norway', flag: '🇳🇴' },
  FI: { label: 'Finland', flag: '🇫🇮' },
  IS: { label: 'Iceland', flag: '🇮🇸' },
  DE: { label: 'Germany', flag: '🇩🇪' },
  AT: { label: 'Austria', flag: '🇦🇹' },
  CH: { label: 'Switzerland', flag: '🇨🇭' },
  NL: { label: 'Netherlands', flag: '🇳🇱' },
  BE: { label: 'Belgium', flag: '🇧🇪' },
  LU: { label: 'Luxembourg', flag: '🇱🇺' },
  FR: { label: 'France', flag: '🇫🇷' },
  MC: { label: 'Monaco', flag: '🇲🇨' },
  ES: { label: 'Spain', flag: '🇪🇸' },
  PT: { label: 'Portugal', flag: '🇵🇹' },
  AD: { label: 'Andorra', flag: '🇦🇩' },
  IT: { label: 'Italy', flag: '🇮🇹' },
  SM: { label: 'San Marino', flag: '🇸🇲' },
  VA: { label: 'Vatican City', flag: '🇻🇦' },
  MT: { label: 'Malta', flag: '🇲🇹' },
  GB: { label: 'United Kingdom', flag: '🇬🇧' },
  IE: { label: 'Ireland', flag: '🇮🇪' },
  GR: { label: 'Greece', flag: '🇬🇷' },
  CY: { label: 'Cyprus', flag: '🇨🇾' },
  PL: { label: 'Poland', flag: '🇵🇱' },
  CZ: { label: 'Czech Republic', flag: '🇨🇿' },
  SK: { label: 'Slovakia', flag: '🇸🇰' },
  HU: { label: 'Hungary', flag: '🇭🇺' },
  SI: { label: 'Slovenia', flag: '🇸🇮' },
  HR: { label: 'Croatia', flag: '🇭🇷' },
  BA: { label: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  RS: { label: 'Serbia', flag: '🇷🇸' },
  ME: { label: 'Montenegro', flag: '🇲🇪' },
  XK: { label: 'Kosovo', flag: '🇽🇰' },
  MK: { label: 'North Macedonia', flag: '🇲🇰' },
  AL: { label: 'Albania', flag: '🇦🇱' },
  BG: { label: 'Bulgaria', flag: '🇧🇬' },
  RO: { label: 'Romania', flag: '🇷🇴' },
  MD: { label: 'Moldova', flag: '🇲🇩' },
  UA: { label: 'Ukraine', flag: '🇺🇦' },
  BY: { label: 'Belarus', flag: '🇧🇾' },
  EE: { label: 'Estonia', flag: '🇪🇪' },
  LV: { label: 'Latvia', flag: '🇱🇻' },
  LT: { label: 'Lithuania', flag: '🇱🇹' },
  LI: { label: 'Liechtenstein', flag: '🇱🇮' },
  TR: { label: 'Turkey', flag: '🇹🇷' },
  IL: { label: 'Israel', flag: '🇮🇱' },
  AE: { label: 'United Arab Emirates', flag: '🇦🇪' },
  HK: { label: 'Hong Kong', flag: '🇭🇰' },
  US: { label: 'USA', flag: '🇺🇸' },
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
  activityNotes: string;
  production: string;
  pricing: string;
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
