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
  Building2,
  Phone,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { Activity, ActivityLink, CostItem, COUNTRIES, MaterialFile, SUGGESTED_TAGS } from '../types';
import { uploadFile } from '../lib/supabase';
import TagBadge from './TagBadge';
import ImportSection from './ImportSection';

type FormData = Omit<Activity, 'id' | 'createdAt' | 'archived'>;

const emptyForm: FormData = {
  title: '',
  shortDescription: '',
  longDescription: '',
  execution: '',
  images: [],
  links: [],
  materials: [],
  costs: [],
  contact: { company: '', country: '', phone: '', whatsapp: '', email: '' },
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const newImages = [...form.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        setError(`Billedet "${file.name}" er for stort (max 10MB)`);
        continue;
      }
      const uploaded = await uploadFile(file);
      if (uploaded) {
        newImages.push(uploaded.url);
      } else {
        setError(`Kunne ikke uploade "${file.name}"`);
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
        setError(`Filen "${file.name}" er for stor (max 50MB)`);
        continue;
      }
      const uploaded = await uploadFile(file);
      if (uploaded) {
        newMaterials.push(uploaded);
      } else {
        setError(`Kunne ikke uploade "${file.name}"`);
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

        <div>
          <label className="block text-xs text-gray-400 mb-1">Eksekvering</label>
          <textarea
            value={form.execution}
            onChange={(e) => update('execution', e.target.value)}
            placeholder="Hvordan afvikles aktiviteten? Trin-for-trin, opsætning, forløb mm."
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
            rows={6}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Varighed (minutter)</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => handleDurationChange(e.target.value)}
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
                Uploader billeder...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload billeder direkte
              </>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex-1 border-t border-white/10" />
          eller paste URL
          <span className="flex-1 border-t border-white/10" />
        </div>

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

      {/* File Upload - Materials */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          Materialer (filer)
        </h3>
        <p className="text-xs text-gray-500">
          Upload materialer som PDF, PowerPoint, Word, billeder mm. (max 50MB per fil)
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
                      Åbn
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
                Uploader...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Vælg filer eller træk hertil
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

      {/* Costs */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-yellow-400" />
          Omkostninger
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
            placeholder="Materiale / post"
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
          />
          <input
            type="text"
            value={newCost.price}
            onChange={(e) => setNewCost((c) => ({ ...c, price: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCost())}
            placeholder="Pris (f.eks. 500 kr)"
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

      {/* Contact / Company */}
      <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Firma & Kontakt
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Firma
            </label>
            <input
              type="text"
              value={form.contact.company}
              onChange={(e) => update('contact', { ...form.contact, company: e.target.value })}
              placeholder="Firmanavn"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Land</label>
            <select
              value={form.contact.country}
              onChange={(e) => update('contact', { ...form.contact, country: e.target.value })}
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-battle-orange"
            >
              {Object.entries(COUNTRIES).map(([code, { label, flag }]) => (
                <option key={code} value={code}>
                  {flag ? `${flag} ${label}` : label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Mobil
            </label>
            <input
              type="tel"
              value={form.contact.phone}
              onChange={(e) => update('contact', { ...form.contact, phone: e.target.value })}
              placeholder="+45 12345678"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </label>
            <input
              type="tel"
              value={form.contact.whatsapp}
              onChange={(e) => update('contact', { ...form.contact, whatsapp: e.target.value })}
              placeholder="+45 12345678"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={form.contact.email}
              onChange={(e) => update('contact', { ...form.contact, email: e.target.value })}
              placeholder="email@firma.dk"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">GameOwner *</label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => update('author', e.target.value)}
            placeholder="Kontaktperson / ansvarlig"
            className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            required
          />
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
