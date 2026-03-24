import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, SlidersHorizontal } from 'lucide-react';
import { fetchActivities } from '../lib/supabase';
import { Activity, SUGGESTED_TAGS } from '../types';
import Header from '../components/Header';
import ActivityCard from '../components/ActivityCard';
import TagBadge from '../components/TagBadge';

const HomePage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    const data = await fetchActivities();
    setActivities(data.filter((a) => !a.archived));
    setIsLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          a.title.toLowerCase().includes(q) ||
          a.shortDescription.toLowerCase().includes(q) ||
          a.longDescription.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.author.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedTags.length > 0 && !selectedTags.some((t) => a.tags.includes(t))) {
        return false;
      }
      if (locationFilter && a.location !== locationFilter) return false;
      if (difficultyFilter && a.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [activities, search, selectedTags, locationFilter, difficultyFilter]);

  const activeFilterCount =
    selectedTags.length + (locationFilter ? 1 : 0) + (difficultyFilter ? 1 : 0);

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Search & Filter Bar */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Søg i aktiviteter..."
                className="w-full bg-battle-grey border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                showFilters || activeFilterCount > 0
                  ? 'bg-battle-orange/20 border-battle-orange/50 text-battle-orange'
                  : 'bg-battle-grey border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-battle-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-battle-grey rounded-xl p-4 border border-white/10 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lokation</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-battle-dark border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-battle-orange"
                  >
                    <option value="">Alle</option>
                    <option value="indendørs">Indendørs</option>
                    <option value="udendørs">Udendørs</option>
                    <option value="begge">Begge dele</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sværhedsgrad</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-battle-dark border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-battle-orange"
                  >
                    <option value="">Alle</option>
                    <option value="let">Let</option>
                    <option value="medium">Medium</option>
                    <option value="svær">Svær</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map((tag) => (
                    <TagBadge
                      key={tag}
                      tag={tag}
                      active={selectedTags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                    />
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setLocationFilter('');
                    setDifficultyFilter('');
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Ryd alle filtre
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-battle-orange animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {activities.length === 0
                ? 'Ingen aktiviteter endnu — opret den første!'
                : 'Ingen aktiviteter matcher dine filtre'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              {filtered.length} aktivitet{filtered.length !== 1 ? 'er' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
