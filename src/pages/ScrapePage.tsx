import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Loader2,
  Search,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Header from '../components/Header';
import { extractActivityFromHtml } from '../lib/contentExtractor';
import { createActivity } from '../lib/supabase';
import { Activity, DIFFICULTY_LABELS, LOCATION_LABELS } from '../types';

type PartialActivity = Partial<Omit<Activity, 'id' | 'createdAt' | 'archived'>>;

interface ScrapedItem {
  url: string;
  data: PartialActivity;
  status: 'pending' | 'accepted' | 'declined';
}

const ScrapePage = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [wizardIndex, setWizardIndex] = useState(-1); // -1 = scan phase, >= 0 = wizard
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    setIsScanning(true);
    setError(null);
    setItems([]);
    setScanProgress('Fetching site and finding sub-pages...');

    try {
      const response = await fetch('/api/scrape-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const { mainPage, subPages } = await response.json();

      setScanProgress(`Found ${subPages.length} sub-pages. Extracting activities...`);

      // Extract activities from all pages
      const scraped: ScrapedItem[] = [];

      // Process main page
      const mainData = extractActivityFromHtml(mainPage.html, mainPage.url);
      if (mainData.title) {
        scraped.push({ url: mainPage.url, data: mainData, status: 'pending' });
      }

      // Process sub-pages
      for (const page of subPages) {
        const pageData = extractActivityFromHtml(page.html, page.url);
        if (pageData.title && pageData.title.length > 3) {
          // Avoid duplicates by title
          const isDupe = scraped.some(
            (s) => s.data.title?.toLowerCase() === pageData.title?.toLowerCase()
          );
          if (!isDupe) {
            scraped.push({ url: page.url, data: pageData, status: 'pending' });
          }
        }
      }

      if (scraped.length === 0) {
        setError('No activities found on this site. Try a different URL.');
        setIsScanning(false);
        return;
      }

      setItems(scraped);
      setWizardIndex(0);
      setScanProgress('');
    } catch (err: any) {
      setError('Could not scrape site: ' + (err.message || 'Unknown error'));
    }

    setIsScanning(false);
  };

  const setItemStatus = (index: number, status: 'accepted' | 'declined') => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status } : item))
    );
  };

  const goNext = () => {
    if (wizardIndex < items.length - 1) {
      setWizardIndex(wizardIndex + 1);
    }
  };

  const goPrev = () => {
    if (wizardIndex > 0) {
      setWizardIndex(wizardIndex - 1);
    }
  };

  const acceptAndNext = () => {
    setItemStatus(wizardIndex, 'accepted');
    if (wizardIndex < items.length - 1) {
      setWizardIndex(wizardIndex + 1);
    }
  };

  const declineAndNext = () => {
    setItemStatus(wizardIndex, 'declined');
    if (wizardIndex < items.length - 1) {
      setWizardIndex(wizardIndex + 1);
    }
  };

  const acceptedCount = items.filter((i) => i.status === 'accepted').length;
  const declinedCount = items.filter((i) => i.status === 'declined').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const handleSaveAll = async () => {
    const accepted = items.filter((i) => i.status === 'accepted');
    if (accepted.length === 0) return;

    setIsSaving(true);
    setSavedCount(0);

    for (const item of accepted) {
      const activity: Omit<Activity, 'id' | 'createdAt' | 'archived'> = {
        title: item.data.title || 'Untitled',
        shortDescription: item.data.shortDescription || '',
        longDescription: item.data.longDescription || '',
        execution: item.data.execution || '',
        images: item.data.images || [],
        links: [{ label: 'Source', url: item.url }],
        materials: [],
        costs: [],
        contact: { company: '', country: '', phone: '', whatsapp: '', email: '' },
        youtubeUrl: item.data.youtubeUrl || '',
        videoUrl: item.data.videoUrl || '',
        tags: item.data.tags || [],
        duration: item.data.duration || '',
        durationMinutes: item.data.durationMinutes || 0,
        groupSize: item.data.groupSize || '',
        difficulty: item.data.difficulty || 'medium',
        location: item.data.location || 'begge',
        author: 'Scraper',
      };

      await createActivity(activity);
      setSavedCount((c) => c + 1);
    }

    setIsSaving(false);
    navigate('/');
  };

  const currentItem = wizardIndex >= 0 && wizardIndex < items.length ? items[wizardIndex] : null;

  // Wizard complete view
  const isWizardDone = items.length > 0 && pendingCount === 0;

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          to="/create"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h2 className="text-2xl font-bold text-white mb-2">Scrape Site</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter a website URL to scan for team building activities. We'll crawl sub-pages and extract as much info as possible. You can review and accept/decline each one before adding.
        </p>

        {/* URL Input */}
        {wizardIndex < 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="https://example.com"
                  disabled={isScanning}
                  className="w-full bg-battle-grey border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={isScanning || !url.trim()}
                className="px-6 py-3 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Scan Site
                  </>
                )}
              </button>
            </div>

            {scanProgress && (
              <div className="flex items-center gap-2 text-sm text-battle-orange">
                <Loader2 className="w-4 h-4 animate-spin" />
                {scanProgress}
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Wizard - Review each item */}
        {currentItem && !isWizardDone && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>
                Activity {wizardIndex + 1} of {items.length}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {acceptedCount} accepted
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-3.5 h-3.5" /> {declinedCount} declined
                </span>
                <span>{pendingCount} remaining</span>
              </div>
            </div>

            <div className="w-full bg-battle-dark rounded-full h-1.5">
              <div
                className="bg-battle-orange h-1.5 rounded-full transition-all"
                style={{ width: `${((wizardIndex + 1) / items.length) * 100}%` }}
              />
            </div>

            {/* Activity preview card */}
            <div
              className={`bg-battle-grey rounded-xl border p-6 space-y-4 ${
                currentItem.status === 'accepted'
                  ? 'border-green-500/50'
                  : currentItem.status === 'declined'
                    ? 'border-red-500/50'
                    : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {currentItem.data.title || 'Untitled'}
                  </h3>
                  <a
                    href={currentItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-battle-orange hover:underline"
                  >
                    {currentItem.url}
                  </a>
                </div>
                {currentItem.status !== 'pending' && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      currentItem.status === 'accepted'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {currentItem.status === 'accepted' ? 'Accepted' : 'Declined'}
                  </span>
                )}
              </div>

              {currentItem.data.shortDescription && (
                <p className="text-gray-400 text-sm">{currentItem.data.shortDescription}</p>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {currentItem.data.duration && (
                  <span className="flex items-center gap-1 bg-battle-dark px-2 py-1 rounded">
                    <Clock className="w-3 h-3" /> {currentItem.data.duration}
                  </span>
                )}
                {currentItem.data.groupSize && (
                  <span className="flex items-center gap-1 bg-battle-dark px-2 py-1 rounded">
                    <Users className="w-3 h-3" /> {currentItem.data.groupSize} ppl
                  </span>
                )}
                {currentItem.data.location && (
                  <span className="flex items-center gap-1 bg-battle-dark px-2 py-1 rounded">
                    <MapPin className="w-3 h-3" /> {LOCATION_LABELS[currentItem.data.location] || currentItem.data.location}
                  </span>
                )}
                {currentItem.data.difficulty && (
                  <span className="bg-battle-dark px-2 py-1 rounded">
                    {DIFFICULTY_LABELS[currentItem.data.difficulty] || currentItem.data.difficulty}
                  </span>
                )}
              </div>

              {currentItem.data.tags && currentItem.data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentItem.data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/10 text-gray-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {currentItem.data.images && currentItem.data.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {currentItem.data.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-battle-dark">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentItem.data.longDescription && (
                <div className="text-gray-400 text-xs leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {currentItem.data.longDescription.substring(0, 500)}
                  {(currentItem.data.longDescription.length || 0) > 500 && '...'}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={wizardIndex === 0}
                className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={declineAndNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={acceptAndNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Accept
                </button>
              </div>

              <button
                onClick={goNext}
                disabled={wizardIndex === items.length - 1}
                className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard complete - summary */}
        {isWizardDone && (
          <div className="space-y-6">
            <div className="bg-battle-grey rounded-xl p-6 border border-white/10 text-center">
              <h3 className="text-xl font-bold text-white mb-3">Review Complete</h3>
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{acceptedCount}</p>
                  <p className="text-xs text-gray-500">Accepted</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{declinedCount}</p>
                  <p className="text-xs text-gray-500">Declined</p>
                </div>
              </div>

              {acceptedCount > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    {acceptedCount} activit{acceptedCount !== 1 ? 'ies' : 'y'} will be added to your idea bank.
                  </p>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="px-6 py-3 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving {savedCount}/{acceptedCount}...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save {acceptedCount} Idea{acceptedCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}

              {acceptedCount === 0 && (
                <p className="text-sm text-gray-500">
                  No activities accepted. Go back to scan another site.
                </p>
              )}

              <button
                onClick={() => {
                  setItems([]);
                  setWizardIndex(-1);
                  setUrl('');
                }}
                className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Scan another site
              </button>
            </div>

            {/* Summary list */}
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm ${
                    item.status === 'accepted'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {item.status === 'accepted' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={item.status === 'accepted' ? 'text-white' : 'text-gray-500'}>
                    {item.data.title}
                  </span>
                  <button
                    onClick={() => {
                      setItemStatus(i, item.status === 'accepted' ? 'declined' : 'accepted');
                    }}
                    className="ml-auto text-xs text-gray-500 hover:text-white"
                  >
                    {item.status === 'accepted' ? 'Decline' : 'Accept'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapePage;
