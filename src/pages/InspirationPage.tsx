import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  X,
  ExternalLink,
  Loader2,
  Trash2,
  Globe,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Pencil,
  Check,
  Folder,
} from 'lucide-react';
import Header from '../components/Header';
import TagBadge from '../components/TagBadge';
import { SUGGESTED_TAGS } from '../types';
import { supabase } from '../lib/supabase';

interface InspirationLink {
  id: string;
  title: string;
  url: string;
  image: string;
  description: string;
  section: string;
  tags: string[];
  createdAt: string;
}

const IDEA_EMPLOYEE_ID = 'emp_z4ftvagjq';

// Predefined sections shown in the picker. Users can also type a custom one;
// anything they've used before is merged in at runtime from the links data.
const DEFAULT_SECTIONS = [
  'TeamChallenge',
  'EventDay',
  'Energizer',
  'Office',
  'Outdoor',
  'Other',
];

interface LinkPayload {
  url?: string;
  image?: string;
  description?: string;
  section?: string;
  tags?: string[];
}

function parsePayload(raw: string | null | undefined): LinkPayload {
  try {
    return raw ? (JSON.parse(raw) as LinkPayload) : {};
  } catch {
    return {};
  }
}

function buildPayload(link: Omit<InspirationLink, 'id' | 'createdAt' | 'title'>): string {
  return JSON.stringify({
    url: link.url,
    image: link.image,
    description: link.description,
    section: link.section,
    tags: link.tags,
  });
}

async function fetchLinks(): Promise<InspirationLink[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'idea-inspiration')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => {
      const payload = parsePayload(row.description);
      return {
        id: row.id,
        title: row.title,
        url: payload.url || '',
        image: payload.image || '',
        description: payload.description || '',
        section: payload.section || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        createdAt: row.created_at,
      };
    });
  } catch {
    return [];
  }
}

async function addLink(link: Omit<InspirationLink, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const { error } = await supabase.from('todos').insert({
      title: link.title,
      description: buildPayload(link),
      assigned_to: IDEA_EMPLOYEE_ID,
      priority: 'Normal',
      category: 'idea-inspiration',
      resolved: false,
      is_error: false,
    });
    return !error;
  } catch {
    return false;
  }
}

async function removeLink(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

async function updateLink(id: string, link: Omit<InspirationLink, 'id' | 'createdAt'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('todos')
      .update({
        title: link.title,
        description: buildPayload(link),
      })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Auto-fetch og:image and title from URL via our extract-url function
async function fetchMeta(url: string): Promise<{ title: string; image: string }> {
  try {
    const response = await fetch(`/api/extract-url?url=${encodeURIComponent(url)}`);
    if (!response.ok) return { title: '', image: '' };
    const { html } = await response.json();

    const ogImage = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
    const ogTitle = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    return {
      title: ogTitle?.[1] || titleTag?.[1]?.trim() || '',
      image: ogImage?.[1] || '',
    };
  } catch {
    return { title: '', image: '' };
  }
}

const InspirationPage = () => {
  const [links, setLinks] = useState<InspirationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);

  const [filterSection, setFilterSection] = useState<string>('');

  const [refreshProgress, setRefreshProgress] = useState<{ done: number; total: number } | null>(null);
  const refreshCancelled = useRef(false);

  const lastLookedUp = useRef<string | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  // Debounced auto-lookup when user pastes/types a URL.
  useEffect(() => {
    const raw = formUrl.trim();
    if (!raw) return;

    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    try { new URL(url); } catch { return; }

    if (url === lastLookedUp.current) return;

    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      lastLookedUp.current = url;
      setIsFetchingMeta(true);
      const meta = await fetchMeta(url);
      setIsFetchingMeta(false);
      if (meta.title) setFormTitle((prev) => prev || meta.title);
      if (meta.image) setFormImage((prev) => prev || meta.image);
    }, 600);

    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [formUrl]);

  const loadLinks = async () => {
    setIsLoading(true);
    const data = await fetchLinks();
    setLinks(data);
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormUrl('');
    setFormImage('');
    setFormDesc('');
    setFormSection('');
    setFormTags([]);
    setShowForm(false);
    lastLookedUp.current = null;
  };

  const startEdit = (link: InspirationLink) => {
    setEditingId(link.id);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormImage(link.image);
    setFormDesc(link.description);
    setFormSection(link.section);
    setFormTags(link.tags);
    lastLookedUp.current = link.url || null;
    setShowForm(true);
  };

  const handleFetchMeta = async () => {
    if (!formUrl.trim()) return;
    let url = formUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    setFormUrl(url);

    setIsFetchingMeta(true);
    const meta = await fetchMeta(url);
    if (meta.title && !formTitle) setFormTitle(meta.title);
    if (meta.image && !formImage) setFormImage(meta.image);
    setIsFetchingMeta(false);
  };

  const handleSubmit = async () => {
    if (!formUrl.trim()) return;

    let url = formUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    const title = formTitle.trim() || (() => { try { return new URL(url).hostname; } catch { return url; } })();

    const payload = {
      title,
      url,
      image: formImage.trim(),
      description: formDesc.trim(),
      section: formSection.trim(),
      tags: formTags,
    };

    setIsSaving(true);
    const success = editingId
      ? await updateLink(editingId, payload)
      : await addLink(payload);

    if (success) {
      if (editingId) {
        setLinks((prev) =>
          prev.map((l) => (l.id === editingId ? { ...l, ...payload } : l)),
        );
      } else {
        await loadLinks();
      }
      resetForm();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    await removeLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const toggleTag = (tag: string) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // A link is "incomplete" if image is missing or title just mirrors the hostname.
  const isIncomplete = (l: InspirationLink) => {
    if (!l.image) return true;
    try {
      if (l.title.trim().toLowerCase() === new URL(l.url).hostname.toLowerCase()) return true;
    } catch { /* ignore */ }
    return false;
  };

  const incompleteCount = links.filter(isIncomplete).length;

  const handleRefreshAll = async () => {
    if (refreshProgress) {
      refreshCancelled.current = true;
      return;
    }
    const targets = links.filter(isIncomplete);
    if (targets.length === 0) return;

    refreshCancelled.current = false;
    setRefreshProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      if (refreshCancelled.current) break;
      const link = targets[i];

      if (link.url) {
        const meta = await fetchMeta(link.url);
        const nextTitle = (!link.title || link.title === (() => { try { return new URL(link.url).hostname; } catch { return ''; } })())
          ? (meta.title || link.title)
          : link.title;
        const nextImage = link.image || meta.image || '';

        if (nextTitle !== link.title || nextImage !== link.image) {
          const ok = await updateLink(link.id, {
            title: nextTitle,
            url: link.url,
            image: nextImage,
            description: link.description,
            section: link.section,
            tags: link.tags,
          });
          if (ok) {
            setLinks((prev) =>
              prev.map((l) =>
                l.id === link.id ? { ...l, title: nextTitle, image: nextImage } : l,
              ),
            );
          }
        }
      }

      setRefreshProgress({ done: i + 1, total: targets.length });
      await new Promise((r) => setTimeout(r, 300));
    }

    setRefreshProgress(null);
    refreshCancelled.current = false;
  };

  // Merge default sections with whatever users have already used.
  const availableSections = useMemo(() => {
    const used = new Set<string>();
    links.forEach((l) => { if (l.section) used.add(l.section); });
    const merged = [...DEFAULT_SECTIONS];
    used.forEach((s) => { if (!merged.includes(s)) merged.push(s); });
    return merged;
  }, [links]);

  const visibleLinks = useMemo(() => {
    if (!filterSection) return links;
    return links.filter((l) => l.section === filterSection);
  }, [links, filterSection]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      const key = l.section || '_none';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [links]);

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Inspiration
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Curated links to team building resources and ideas from around the web.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(incompleteCount > 0 || refreshProgress) && (
              <button
                onClick={handleRefreshAll}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                title="Re-fetch title & image for links with missing metadata"
              >
                {refreshProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {refreshProgress.done}/{refreshProgress.total} — Cancel
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh {incompleteCount} missing
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Add Link'}
            </button>
          </div>
        </div>

        {/* Section filter bar */}
        {availableSections.length > 0 && links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setFilterSection('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !filterSection
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All ({links.length})
            </button>
            {availableSections
              .filter((s) => sectionCounts[s])
              .map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSection(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                    filterSection === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Folder className="w-3 h-3" />
                  {s} ({sectionCounts[s]})
                </button>
              ))}
            {sectionCounts._none > 0 && (
              <button
                onClick={() => setFilterSection('')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-500 cursor-default"
                title="Unassigned links — pick a section via edit"
              >
                unassigned ({sectionCounts._none})
              </button>
            )}
          </div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <div className="bg-battle-grey rounded-xl p-6 border border-purple-500/20 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {editingId ? 'Edit link' : 'New link'}
              </h3>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">URL *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  onBlur={handleFetchMeta}
                  placeholder="https://example.com/teambuilding-ideas"
                  className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleFetchMeta}
                  disabled={isFetchingMeta || !formUrl.trim()}
                  className="px-3 py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                  title="Auto-detect title & image"
                >
                  {isFetchingMeta ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Site name (auto-detected)"
                  className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="Image URL (auto-detected)"
                  className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {formImage && (
              <div className="aspect-video max-w-xs rounded-lg overflow-hidden bg-battle-dark">
                <img
                  src={formImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Section</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableSections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormSection(formSection === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      formSection === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Folder className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                placeholder="Or type a custom section"
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    active={formTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description / note</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Why is this useful? Add notes, quotes, adaptation ideas…"
                rows={3}
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formUrl.trim() || isSaving}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {editingId ? 'Update Link' : 'Save Link'}
            </button>
          </div>
        )}

        {/* Links grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : visibleLinks.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {filterSection ? `No links in "${filterSection}" yet` : 'No inspiration links yet'}
            </p>
            <p className="text-gray-600 text-sm">
              {filterSection ? 'Try another section or clear the filter.' : 'Add your first link to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleLinks.map((link) => (
              <div
                key={link.id}
                className="bg-battle-grey rounded-xl border border-white/10 hover:border-purple-500/30 transition-all group overflow-hidden flex flex-col"
              >
                {/* Image */}
                {link.image ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <div className="aspect-video overflow-hidden bg-battle-dark relative">
                      <img
                        src={link.image}
                        alt={link.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </a>
                ) : (
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <div className="aspect-video overflow-hidden bg-battle-dark flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-700" />
                    </div>
                  </a>
                )}

                {/* Content */}
                <div className="p-4 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-start gap-2">
                    <h3 className="text-white font-semibold text-base line-clamp-2 flex-1">
                      {link.title}
                    </h3>
                    {link.section && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-medium">
                        <Folder className="w-3 h-3" />
                        {link.section}
                      </span>
                    )}
                  </div>

                  {link.description && (
                    <p className="text-sm text-gray-400 line-clamp-3">{link.description}</p>
                  )}

                  {link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {link.tags.map((t) => (
                        <TagBadge key={t} tag={t} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit Site
                    </a>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        {new Date(link.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <button
                        onClick={() => startEdit(link)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-purple-300 transition-all p-1"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationPage;
