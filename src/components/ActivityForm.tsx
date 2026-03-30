import { useState, useRef } from 'react';
import {
  Save,
  Loader2,
  Plus,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube,
  Video,
  Upload,
  FileText,
  File as FileIcon,
  DollarSign,
} from 'lucide-react';
import { Activity, ActivityLink, CostItem, MaterialFile, SUGGESTED_TAGS } from '../types';
import { uploadFile } from '../lib/supabase';
import TagBadge from './TagBadge';
import ImportSection from './ImportSection';
import CompanySelector from './CompanySelector';

type FormData = Omit<Activity, 'id' | 'createdAt' | 'archived'>;

const emptyForm: FormData = {
  title: '',
  shortDescription: '',
  longDescription: '',
  execution: '',
  activityNotes: '',
  production: '',
  pricing: '',
  originalText: null,
  images: [],
  links: [],
  materials: [],
  costs: [],
  contact: { company: '', country: '', website: '', phone: '', whatsapp: '', email: '', notes: '' },
  youtubeUrl: '',
  videoUrl: '',
  tags: [],
  duration: '',
  durationMinutes: 0,
  groupSize: '',
  difficulty: 'medium',
  location: 'begge',
  author: '',
};

const ACCEPTED_FILE_TYPES = '.pptx,.docx,.pdf,.png,.jpg,.jpeg,.gif,.xlsx,.txt,.csv,.mp4,.mov';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.includes('pdf')) return FileText;
  return FileIcon;
}

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [newLink, setNewLink] = useState<ActivityLink>({ label: '', url: '' });
  const [newCost, setNewCost] = useState<CostItem>({ description: '', price: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleImport = (data: Partial<FormData>) => {
    setForm((prev) => {
      const merged = { ...prev };
      if (data.title && !prev.title) merged.title = data.title;
      if (data.shortDescription && !prev.shortDescription) merged.shortDescription = data.shortDescription;
      if (data.longDescription && !prev.longDescription) merged.longDescription = data.longDescription;
      if (data.duration && !prev.duration) {
        merged.duration = data.duration;
        merged.durationMinutes = data.durationMinutes || 0;
      }
      if (data.groupSize && !prev.groupSize) merged.groupSize = data.groupSize;
      if (data.location) merged.location = data.location;
      if (data.difficulty) merged.difficulty = data.difficulty;
      if (data.tags && data.tags.length > 0) {
        merged.tags = [...new Set([...prev.tags, ...data.tags])];
      }
      if (data.images && data.images.length > 0) {
        merged.images = [...new Set([...prev.images, ...data.images])];
      }
      if (data.youtubeUrl && !prev.youtubeUrl) merged.youtubeUrl = data.youtubeUrl;
      if (data.videoUrl && !prev.videoUrl) merged.videoUrl = data.videoUrl;
      return merged;
    });
  };

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDurationChange = (value: string) => {
    update('duration', value);
    const match = value.match(/(\d+)/);
    update('durationMinutes', match ? parseInt(match[1], 10) : 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const result = await onSubmit(form);
    if (!result.success) {
      setError(result.error || 'An error occurred');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const newImages = [...form.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large (max 10MB)`);
        continue;
      }
      const uploaded = await uploadFile(file);
      if (uploaded) {
        newImages.push(uploaded.url);
      } else {
        setError(`Could not upload "${file.name}"`);
      }
    }

    update('images', newImages);
    setIsUploadingImages(false);
    if (imageUploadRef.current) imageUploadRef.current.value = '';
  };

  const addCost = () => {
    if (newCost.description.trim()) {
      update('costs', [...form.costs, { description: newCost.description.trim(), price: newCost.price.trim() }]);
      setNewCost({ description: '', price: '' });
    }
  };

  const removeCost = (index: number) => {
    update('costs', form.costs.filter((_, i) => i !== index));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newMaterials: MaterialFile[] = [...form.materials];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" is too large (max 50MB)`);
        continue;
      }
      const uploaded = await uploadFile(file);
      if (uploaded) {
        newMaterials.push(uploaded);
      } else {
        setError(`Could not upload "${file.name}"`);
      }
    }

    update('materials', newMaterials);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      {/* Smart Import */}
      {!initial && <ImportSection onImport={handleImport} />}

      {/* Basics */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Basic Info</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Name of the activity"
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            required
          />
        </div>


        <div>
          <label className="block text-xs text-gray-400 mb-1">Short Description</label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="A short summary (shown on the card)"
            maxLength={200}
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Full Description</label>
          <textarea
            value={form.longDescription}
            onChange={(e) => update('longDescription', e.target.value)}
            placeholder="Detailed description of the activity, rules, tips etc."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
            rows={6}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Execution</label>
          <textarea
            value={form.execution}
            onChange={(e) => update('execution', e.target.value)}
            placeholder="How is the activity run? Step-by-step, setup, flow etc."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
            rows={6}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Notes</label>
          <textarea
            value={form.activityNotes}
            onChange={(e) => update('activityNotes', e.target.value)}
            placeholder="Internal notes, ideas, reminders..."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Duration (minutes)</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              placeholder="e.g. 30 min"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Group Size</label>
            <input
              type="text"
              value={form.groupSize}
              onChange={(e) => update('groupSize', e.target.value)}
              placeholder="e.g. 4-10"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value as Activity['difficulty'])}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-battle-orange text-sm"
            >
              <option value="let">Easy</option>
              <option value="medium">Medium</option>
              <option value="svær">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <select
              value={form.location}
              onChange={(e) => update('location', e.target.value as Activity['location'])}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-battle-orange text-sm"
            >
              <option value="indendørs">Indoor</option>
              <option value="udendørs">Outdoor</option>
              <option value="begge">Both</option>
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
          Video & Media
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
            Video URL (direct link to video file)
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
          Images
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

        {/* Direct image upload */}
        <div>
          <input
            ref={imageUploadRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isUploadingImages
                ? 'border-battle-orange/50 bg-battle-orange/10 text-battle-orange cursor-wait'
                : 'border-white/20 hover:border-blue-400/50 text-gray-400 hover:text-white'
            }`}
          >
            {isUploadingImages ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading images...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload images directly
              </>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex-1 border-t border-white/10" />
          or paste URL
          <span className="flex-1 border-t border-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            placeholder="Paste image URL here"
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

      {/* File Upload - Materials */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          Materials (files)
        </h3>
        <p className="text-xs text-gray-500">
          Upload materials such as PDF, PowerPoint, Word, images etc. (max 50MB per file)
        </p>

        {form.materials.length > 0 && (
          <div className="space-y-2">
            {form.materials.map((mat, i) => {
              const Icon = getFileIcon(mat.type);
              return (
                <div key={i} className="flex items-center gap-3 bg-battle-dark rounded-lg px-4 py-3">
                  <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{mat.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(mat.size)}</p>
                  </div>
                  {mat.url && (
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-battle-orange hover:text-battle-orangeLight"
                    >
                      Open
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isUploading
                ? 'border-battle-orange/50 bg-battle-orange/10 text-battle-orange'
                : 'border-white/20 hover:border-battle-orange/50 text-gray-400 hover:text-white'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Choose files or drag here
              </>
            )}
          </label>
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
            placeholder="Link name"
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

      {/* Costs */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-yellow-400" />
          Costs
        </h3>

        {form.costs.length > 0 && (
          <div className="space-y-2">
            {form.costs.map((cost, i) => (
              <div key={i} className="flex items-center gap-2 bg-battle-dark rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-sm text-white flex-1">{cost.description}</span>
                {cost.price && <span className="text-sm text-yellow-400 font-medium">{cost.price}</span>}
                <button type="button" onClick={() => removeCost(i)} className="text-red-400 hover:text-red-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newCost.description}
            onChange={(e) => setNewCost((c) => ({ ...c, description: e.target.value }))}
            placeholder="Item / description"
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <input
            type="text"
            value={newCost.price}
            onChange={(e) => setNewCost((c) => ({ ...c, price: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCost())}
            placeholder="Price (e.g. €50)"
            className="w-1/3 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <button
            type="button"
            onClick={addCost}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Production & Pricing */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Production & Pricing
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Production</label>
            <textarea
              value={form.production}
              onChange={(e) => update('production', e.target.value)}
              placeholder="Production costs, supplier info, materials needed..."
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none text-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pricing</label>
            <textarea
              value={form.pricing}
              onChange={(e) => update('pricing', e.target.value)}
              placeholder="Pricing model, rates, packages..."
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none text-sm"
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* Contact / Company */}
      <CompanySelector
        contact={form.contact}
        author={form.author}
        onChange={(contact) => update('contact', contact)}
        onAuthorChange={(author) => update('author', author)}
      />

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
