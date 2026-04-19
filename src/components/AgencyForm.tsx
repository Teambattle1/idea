import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { Agency, AGENCY_SERVICES, COUNTRIES, SUGGESTED_TAGS } from '../types';
import TagBadge from './TagBadge';

type AgencyDraft = Omit<Agency, 'id' | 'createdAt'>;

const EMPTY: AgencyDraft = {
  name: '',
  logo: '',
  website: '',
  country: '',
  city: '',
  address: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  services: [],
  tags: [],
  notes: '',
};

interface Props {
  initial?: Agency | null;
  onClose: () => void;
  onSave: (draft: AgencyDraft) => Promise<{ success: boolean; error?: string }>;
}

const AgencyForm = ({ initial, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<AgencyDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [customTag, setCustomTag] = useState('');

  useEffect(() => {
    if (initial) {
      const { id: _id, createdAt: _c, ...rest } = initial;
      setDraft(rest);
    } else {
      setDraft(EMPTY);
    }
  }, [initial]);

  const set = <K extends keyof AgencyDraft>(key: K, value: AgencyDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleService = (s: string) =>
    set(
      'services',
      draft.services.includes(s) ? draft.services.filter((x) => x !== s) : [...draft.services, s],
    );

  const toggleTag = (t: string) =>
    set('tags', draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t]);

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !draft.tags.includes(t)) set('tags', [...draft.tags, t]);
    setCustomTag('');
  };

  // Use the existing extract-url function to auto-fill logo + name from website.
  const fetchFromWebsite = async () => {
    if (!draft.website.trim()) return;
    let url = draft.website.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    setFetchingLogo(true);
    try {
      const res = await fetch(`/api/extract-url?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const { html } = await res.json();
      if (!html) return;

      const og = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
      const titleTag = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i)
        || html.match(/<title[^>]*>([^<]+)<\/title>/i);

      if (og && !draft.logo) set('logo', og[1]);
      if (titleTag && !draft.name) set('name', titleTag[1].trim());
    } catch {
      // Silent — user can fill manually
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSave({ ...draft, name: draft.name.trim() });
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'Could not save');
      return;
    }
    onClose();
  };

  const inputClass =
    'w-full bg-battle-dark border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none placeholder:text-gray-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-battle-grey rounded-xl border border-white/10 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {initial ? 'Edit agency' : 'Add agency'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Website</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="example.com"
                className={inputClass}
              />
              <button
                type="button"
                onClick={fetchFromWebsite}
                disabled={fetchingLogo || !draft.website.trim()}
                className="flex-shrink-0 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 disabled:opacity-40 text-purple-200 rounded-lg text-sm flex items-center gap-1.5 border border-purple-500/30"
                title="Auto-fetch logo and name"
              >
                {fetchingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Auto-fill
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Logo URL</label>
              <input
                type="text"
                value={draft.logo}
                onChange={(e) => set('logo', e.target.value)}
                placeholder="https://…/logo.png"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Country</label>
              <select
                value={draft.country}
                onChange={(e) => set('country', e.target.value)}
                className={inputClass}
              >
                {Object.entries(COUNTRIES).map(([code, { label, flag }]) => (
                  <option key={code} value={code}>
                    {flag} {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">City</label>
              <input
                type="text"
                value={draft.city}
                onChange={(e) => set('city', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
              <input
                type="text"
                value={draft.address}
                onChange={(e) => set('address', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Contact name</label>
              <input
                type="text"
                value={draft.contactName}
                onChange={(e) => set('contactName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Contact email</label>
              <input
                type="email"
                value={draft.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Contact phone</label>
              <input
                type="tel"
                value={draft.contactPhone}
                onChange={(e) => set('contactPhone', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Services</label>
            <div className="flex flex-wrap gap-1.5">
              {AGENCY_SERVICES.map((s) => (
                <TagBadge
                  key={s}
                  tag={s}
                  active={draft.services.includes(s)}
                  onClick={() => toggleService(s)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[...new Set([...SUGGESTED_TAGS, ...draft.tags])].map((t) => (
                <TagBadge
                  key={t}
                  tag={t}
                  active={draft.tags.includes(t)}
                  onClick={() => toggleTag(t)}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Add custom tag…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                className="flex-shrink-0 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Relevant info, past collaborations, strengths…"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Save changes' : 'Create agency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgencyForm;
