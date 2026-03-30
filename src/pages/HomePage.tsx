import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, SlidersHorizontal, Clock, Video } from 'lucide-react';
import { fetchActivities } from '../lib/supabase';
import { scanAndUpdateVideoUrls, ScanResult } from '../lib/videoScanner';
import { Activity, SUGGESTED_TAGS, DURATION_RANGES } from '../types';
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
  const [durationFilter, setDurationFilter] = useState<number>(0); // index into DURATION_RANGES
  const [showFilters, setShowFilters] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    const data = await fetchActivities();
    setActivities(data.filter((a) => !a.archived));
    setIsLoading(false);
  };

  const handleVideoScan = async () => {
    setIsScanning(true);
    const results = await scanAndUpdateVideoUrls();
    setScanResults(results);
    setIsScanning(false);
    if (results.some((r) => r.updated)) {
      await loadActivities();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      // Text search across all fields
      if (search) {
        const q = search.toLowerCase();
        const searchFields = [
          a.title,
          a.shortDescription,
          a.longDescription,
          a.author,
          a.duration,
          a.groupSize,
          a.location,
          a.difficulty,
          ...a.tags,
          ...a.materials.map((m) => m.name),
          ...a.links.map((l) => l.label),
        ];
        const match = searchFields.some((field) =>
          field.toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      // Tag filter
      if (selectedTags.length > 0 && !selectedTags.some((t) => a.tags.includes(t))) {
        return false;
      }

      // Location filter
      if (locationFilter && a.location !== locationFilter) return false;

      // Difficulty filter
      if (difficultyFilter && a.difficulty !== difficultyFilter) return false;

      // Duration filter
      if (durationFilter > 0) {
        const range = DURATION_RANGES[durationFilter];
        if (a.durationMinutes < range.min || a.durationMinutes > range.max) {
          return false;
        }
      }

      return true;
    });
  }, [activities, search, selectedTags, locationFilter, difficultyFilter, durationFilter]);

  const activeFilterCount =
    selectedTags.length +
    (locationFilter ? 1 : 0) +
    (difficultyFilter ? 1 : 0) +
    (durationFilter > 0 ? 1 : 0);

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
                placeholder="Search all fields (title, description, tags, materials, author...)"
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
            <button
              onClick={handleVideoScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border bg-battle-grey border-white/10 text-gray-400 hover:text-white hover:border-red-500/30 disabled:opacity-50"
              title="Scan all ideas for video URLs"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              Scan Videos
            </button>
          </div>

          {scanResults && (
            <div className="bg-battle-grey rounded-lg p-3 border border-white/10 text-xs">
              {scanResults.length === 0 ? (
                <span className="text-gray-500">No new video URLs found in existing ideas.</span>
              ) : (
                <div className="space-y-1">
                  <span className="text-green-400 font-medium">
                    Found videos in {scanResults.length} idea{scanResults.length !== 1 ? 's' : ''}:
                  </span>
                  {scanResults.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-gray-400">
                      <span className={r.updated ? 'text-green-400' : 'text-gray-500'}>
                        {r.updated ? '✓' : '–'}
                      </span>
                      <span className="text-white">{r.title}</span>
                      {r.foundYouTube && <span className="text-red-400">YouTube</span>}
                      {r.foundVideo && <span className="text-blue-400">Video</span>}
                      {!r.updated && <span className="text-gray-600">(already set)</span>}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setScanResults(null)}
                className="mt-2 text-gray-500 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {showFilters && (
            <div className="bg-battle-grey rounded-xl p-4 border border-white/10 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-battle-dark border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-battle-orange"
                  >
                    <option value="">All</option>
                    <option value="indendørs">Indoor</option>
                    <option value="udendørs">Outdoor</option>
                    <option value="begge">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-battle-dark border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-battle-orange"
                  >
                    <option value="">All</option>
                    <option value="let">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="svær">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Duration
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(Number(e.target.value))}
                    className="bg-battle-dark border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-battle-orange"
                  >
                    {DURATION_RANGES.map((range, i) => (
                      <option key={i} value={i}>
                        {range.label}
                      </option>
                    ))}
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
                    setDurationFilter(0);
                  }}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear all filters
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
                ? 'No ideas yet — create the first one!'
                : 'No ideas match your filters'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              {filtered.length} idea{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
