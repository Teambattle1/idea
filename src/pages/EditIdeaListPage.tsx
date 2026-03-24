import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  GripVertical,
  Search,
} from 'lucide-react';
import { fetchIdeaList, updateIdeaList, fetchActivities } from '../lib/supabase';
import { Activity } from '../types';
import Header from '../components/Header';

const EditIdeaListPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([fetchIdeaList(id), fetchActivities()]).then(
        ([listData, allActivities]) => {
          if (listData) {
            setTitle(listData.title);
            setDescription(listData.description);
            setAuthor(listData.author);
            setSelectedIds(listData.activityIds);
          }
          setActivities(allActivities.filter((a) => !a.archived));
          setIsLoading(false);
        }
      );
    }
  }, [id]);

  const toggleActivity = (activityId: string) => {
    setSelectedIds((prev) =>
      prev.includes(activityId) ? prev.filter((x) => x !== activityId) : [...prev, activityId]
    );
  };

  const removeActivity = (activityId: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== activityId));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const filteredActivities = activities.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.shortDescription.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !id) return;
    setIsSubmitting(true);
    setError(null);
    const result = await updateIdeaList(id, {
      title: title.trim(),
      description: description.trim(),
      activityIds: selectedIds,
      author: author.trim(),
    });
    if (result.success) {
      navigate(`/list/${id}`);
    } else {
      setError(result.error || 'Der opstod en fejl');
    }
    setIsSubmitting(false);
  };

  const selectedActivities = selectedIds
    .map((sid) => activities.find((a) => a.id === sid))
    .filter((a): a is Activity => !!a);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-battle-orange animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          to={`/list/${id}`}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til listen
        </Link>

        <h2 className="text-2xl font-bold text-white mb-6">Rediger ide-liste</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Listenavn *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Dit navn *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Beskrivelse</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
              />
            </div>
          </section>

          {selectedActivities.length > 0 && (
            <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-3">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                Valgte aktiviteter ({selectedActivities.length})
              </h3>
              <div className="space-y-2">
                {selectedActivities.map((a, index) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 bg-battle-dark rounded-lg px-3 py-2"
                  >
                    <span className="text-battle-orange font-bold text-sm w-5 text-center">
                      {index + 1}
                    </span>
                    <GripVertical className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-white flex-1">{a.title}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveUp(index)} className="text-gray-500 hover:text-white text-xs px-1" disabled={index === 0}>↑</button>
                      <button type="button" onClick={() => moveDown(index)} className="text-gray-500 hover:text-white text-xs px-1" disabled={index === selectedActivities.length - 1}>↓</button>
                      <button type="button" onClick={() => removeActivity(a.id)} className="text-red-400 hover:text-red-300 ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-battle-grey rounded-xl p-6 border border-white/10 space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Tilføj aktiviteter</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Søg efter aktiviteter..."
                className="w-full bg-battle-dark border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredActivities.map((a) => {
                const isSelected = selectedIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleActivity(a.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      isSelected ? 'bg-battle-orange/20 border border-battle-orange/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${isSelected ? 'bg-battle-orange border-battle-orange text-white' : 'border-white/20'}`}>
                      {isSelected && '✓'}
                    </span>
                    <span className="text-white flex-1">{a.title}</span>
                    <span className="text-xs text-gray-500">{a.duration}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={!title.trim() || !author.trim() || isSubmitting}
            className="w-full px-4 py-3 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Gem ændringer
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditIdeaListPage;
