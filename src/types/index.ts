export interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  links: ActivityLink[];
  materials: string[];
  youtubeUrl: string;
  videoUrl: string;
  tags: string[];
  duration: string;
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

export interface IdeaList {
  id: string;
  title: string;
  description: string;
  activityIds: string[];
  author: string;
  createdAt: string;
  archived: boolean;
}

export type ViewState =
  | { page: 'home' }
  | { page: 'create-activity' }
  | { page: 'edit-activity'; id: string }
  | { page: 'activity-detail'; id: string }
  | { page: 'idea-lists' }
  | { page: 'create-idea-list' }
  | { page: 'edit-idea-list'; id: string }
  | { page: 'idea-list-detail'; id: string };

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
