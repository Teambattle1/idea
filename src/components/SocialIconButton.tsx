import { Facebook, Linkedin, Instagram, MessageCircle, Video, Users } from 'lucide-react';

export type SocialKind =
  | 'facebook'
  | 'linkedin'
  | 'instagram'
  | 'whatsapp'
  | 'teams'
  | 'zoom';

interface Props {
  kind: SocialKind;
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

const META: Record<
  SocialKind,
  { label: string; color: string; Icon: typeof Facebook; placeholder: string; normalize?: (v: string) => string }
> = {
  facebook: {
    label: 'Facebook',
    color: '#1877f2',
    Icon: Facebook,
    placeholder: 'https://facebook.com/company',
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0a66c2',
    Icon: Linkedin,
    placeholder: 'https://linkedin.com/company/…',
  },
  instagram: {
    label: 'Instagram',
    color: '#e1306c',
    Icon: Instagram,
    placeholder: 'https://instagram.com/handle',
  },
  whatsapp: {
    label: 'WhatsApp',
    color: '#25d366',
    Icon: MessageCircle,
    placeholder: '+45 12345678 or https://wa.me/…',
    normalize: (v) => {
      const trimmed = v.trim();
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      const digits = trimmed.replace(/[^\d]/g, '');
      return digits ? `https://wa.me/${digits}` : trimmed;
    },
  },
  teams: {
    label: 'Teams',
    color: '#4b53bc',
    Icon: Users,
    placeholder: 'https://teams.microsoft.com/l/meetup-join/…',
  },
  zoom: {
    label: 'Zoom',
    color: '#2d8cff',
    Icon: Video,
    placeholder: 'https://zoom.us/j/…',
  },
};

const SocialIconButton = ({ kind, value, onChange, size = 'md' }: Props) => {
  const meta = META[kind];
  const Icon = meta.Icon;
  const active = Boolean((value || '').trim());
  const dims = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const handleClick = (e: React.MouseEvent) => {
    if (active && !e.shiftKey) {
      window.open(value, '_blank', 'noopener,noreferrer');
      return;
    }
    const input = window.prompt(`${meta.label} URL`, value || '');
    if (input === null) return;
    const normalized = meta.normalize ? meta.normalize(input) : input.trim();
    onChange(normalized);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const input = window.prompt(`${meta.label} URL (edit or clear)`, value || '');
    if (input === null) return;
    const normalized = meta.normalize ? meta.normalize(input) : input.trim();
    onChange(normalized);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={active ? `${meta.label}: ${value} (right-click to edit)` : `Add ${meta.label} URL`}
      className={`${dims} rounded-full flex items-center justify-center transition-colors border ${
        active ? 'border-transparent' : 'border-white/15 hover:bg-white/10'
      }`}
      style={active ? { backgroundColor: meta.color, color: 'white' } : { color: '#9ca3af' }}
    >
      <Icon className={iconSize} />
    </button>
  );
};

export default SocialIconButton;
export { META as SOCIAL_META };
