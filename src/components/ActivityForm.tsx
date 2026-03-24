import { useState } from 'react';
import {
  Save,
  Loader2,
  Plus,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube,
  Video,
  Package,
} from 'lucide-react';
import { Activity, ActivityLink, SUGGESTED_TAGS } from '../types';
import TagBadge from './TagBadge';

type FormData = Omit<Activity, 'id' | 'createdAt' | 'archived'>;

const emptyForm: FormData = {
  title: '',
  shortDescription: '',
  longDescription: '',
  images: [],
  links: [],
  materials: [],
  youtubeUrl: '',
  videoUrl: '',
  tags: [],
  duration: '',
  groupSize: '',
  difficulty: 'medium',
  location: 'begge',
  author: '',
};

const ActivityForm = ({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: FormData;
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
  submitLabel: string;
}) => {
  const [form, setForm] = useState<FormData>(initial || emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLink, setNewLink] = useState<ActivityLink>({ label: '', url: '' });
  const [newMaterial, setNewMaterial] = useState('');

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const result = await onSubmit(form);
    if (!result.success) {
      setError(result.error || 'Der opstod en fejl');
    }
    setIsSubmitting(false);
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      update('images', [...form.images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    update('images', form.images.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (newLink.url.trim()) {
      update('links', [...form.links, { label: newLink.label || newLink.url, url: newLink.url }]);
      setNewLink({ label: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    update('links', form.links.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      update('materials', [...form.materials, newMaterial.trim()]);
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    update('materials', form.materials.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (form.tags.includes(tag)) {
      update('tags', form.tags.filter((t) => t !== tag));
    } else {
      update('tags', [...form.tags, tag]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basics */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Grundinfo</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Titel *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Navnet på aktiviteten"
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Dit navn *</label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => update('author', e.target.value)}
            placeholder="Hvem opretter denne aktivitet?"
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Kort beskrivelse</label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="En kort opsummering (vises på kortet)"
            maxLength={200}
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Fuld beskrivelse</label>
          <textarea
            value={form.longDescription}
            onChange={(e) => update('longDescription', e.target.value)}
            placeholder="Detaljeret beskrivelse af aktiviteten, regler, tips mm."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
            rows={6}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Varighed</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => update('duration', e.target.value)}
              placeholder="f.eks. 30 min"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gruppestørrelse</label>
            <input
              type="text"
              value={form.groupSize}
              onChange={(e) => update('groupSize', e.target.value)}
              placeholder="f.eks. 4-10"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sværhedsgrad</label>
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value as Activity['difficulty'])}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-battle-orange text-sm"
            >
              <option value="let">Let</option>
              <option value="medium">Medium</option>
              <option value="svær">Svær</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Lokation</label>
            <select
              value={form.location}
              onChange={(e) => update('location', e.target.value as Activity['location'])}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-battle-orange text-sm"
            >
              <option value="indendørs">Indendørs</option>
              <option value="udendørs">Udendørs</option>
              <option value="begge">Begge dele</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-3">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              active={form.tags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      </section>

      {/* Media */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          Video & Medier
        </h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">YouTube URL</label>
          <input
            type="url"
            value={form.youtubeUrl}
            onChange={(e) => update('youtubeUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            Video URL (direkte link til videofil)
          </label>
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => update('videoUrl', e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
          />
        </div>
      </section>

      {/* Images */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-400" />
          Billeder
        </h3>

        {form.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.images.map((url, i) => (
              <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-battle-dark">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            placeholder="Paste billed-URL her"
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <button
            type="button"
            onClick={addImage}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Links */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-purple-400" />
          Links
        </h3>

        {form.links.length > 0 && (
          <div className="space-y-2">
            {form.links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 bg-battle-dark rounded-lg px-3 py-2">
                <LinkIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-white flex-1 truncate">{link.label}</span>
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{link.url}</span>
                <button type="button" onClick={() => removeLink(i)} className="text-red-400 hover:text-red-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newLink.label}
            onChange={(e) => setNewLink((l) => ({ ...l, label: e.target.value }))}
            placeholder="Linknavn"
            className="w-1/3 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <input
            type="url"
            value={newLink.url}
            onChange={(e) => setNewLink((l) => ({ ...l, url: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
            placeholder="https://..."
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Materials */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" />
          Materialer
        </h3>

        {form.materials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.materials.map((mat, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 bg-battle-dark px-3 py-1.5 rounded-full text-sm text-white"
              >
                {mat}
                <button type="button" onClick={() => removeMaterial(i)} className="text-red-400 hover:text-red-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMaterial}
            onChange={(e) => setNewMaterial(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
            placeholder="Tilføj materiale (f.eks. bold, reb, papir)"
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <button
            type="button"
            onClick={addMaterial}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

      <button
        type="submit"
        disabled={!form.title.trim() || !form.author.trim() || isSubmitting}
        className="w-full px-4 py-3 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {submitLabel}
      </button>
    </form>
  );
};

export default ActivityForm;
