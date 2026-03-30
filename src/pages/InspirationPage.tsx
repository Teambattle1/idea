import { useState, useEffect } from 'react';
import {
  Plus,
  X,
  ExternalLink,
  Loader2,
  Trash2,
  Globe,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';

interface InspirationLink {
  id: string;
  title: string;
  url: string;
  image: string;
  description: string;
  createdAt: string;
}

const IDEA_EMPLOYEE_ID = 'emp_z4ftvagjq';

async function fetchLinks(): Promise<InspirationLink[]> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('category', 'idea-inspiration')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => {
      let payload: any = {};
      try { payload = JSON.parse(row.description || '{}'); } catch { payload = {}; }
      return {
        id: row.id,
        title: row.title,
        url: payload.url || '',
        image: payload.image || '',
        description: payload.description || '',
        createdAt: row.created_at,
      };
    });
  } catch {
    return [];
  }
}

async function addLink(title: string, url: string, image: string, description: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('todos').insert({
      title,
      description: JSON.stringify({ url, image, description }),
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
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setIsLoading(true);
    const data = await fetchLinks();
    setLinks(data);
    setIsLoading(false);
  };

  const handleFetchMeta = async () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    setNewUrl(url);

    setIsFetchingMeta(true);
    const meta = await fetchMeta(url);
    if (meta.title && !newTitle) setNewTitle(meta.title);
    if (meta.image && !newImage) setNewImage(meta.image);
    setIsFetchingMeta(false);
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;

    let url = newUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;

    const title = newTitle.trim() || (() => { try { return new URL(url).hostname; } catch { return url; } })();

    setIsSaving(true);
    const success = await addLink(title, url, newImage.trim(), newDesc.trim());
    if (success) {
      setNewTitle('');
      setNewUrl('');
      setNewImage('');
      setNewDesc('');
      setShowForm(false);
      await loadLinks();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    await removeLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

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
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Link'}
          </button>
        </div>

        {/* Add link form */}
        {showForm && (
          <div className="bg-battle-grey rounded-xl p-6 border border-purple-500/20 mb-6 space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">URL *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onBlur={handleFetchMeta}
                  placeholder="https://example.com/teambuilding-ideas"
                  className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleFetchMeta}
                  disabled={isFetchingMeta || !newUrl.trim()}
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
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Site name (auto-detected)"
                  className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Image URL</label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Image URL (auto-detected)"
                  className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {newImage && (
              <div className="aspect-video max-w-xs rounded-lg overflow-hidden bg-battle-dark">
                <img src={newImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Note</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Why is this useful? (optional)"
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!newUrl.trim() || isSaving}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Link
            </button>
          </div>
        )}

        {/* Links grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No inspiration links yet</p>
            <p className="text-gray-600 text-sm">Add your first link to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="bg-battle-grey rounded-xl border border-white/10 hover:border-purple-500/30 transition-all group overflow-hidden"
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
                <div className="p-4 space-y-2">
                  <h3 className="text-white font-semibold text-base truncate">{link.title}</h3>

                  {link.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{link.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
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
                        onClick={() => handleDelete(link.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
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
