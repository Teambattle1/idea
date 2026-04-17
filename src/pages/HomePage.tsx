import { useState, useEffect, useRef } from 'react';
import {
  Lightbulb,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  User,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  fetchIdeas,
  submitIdea,
  fetchUrlMetadata,
  URL_REGEX,
  IdeaTodo,
  UrlMetadata,
} from '../lib/supabase';

const HomePage = () => {
  const [ideas, setIdeas] = useState<IdeaTodo[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const lastLookedUpUrl = useRef<string | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  // Debounced URL auto-lookup whenever the idea text changes.
  useEffect(() => {
    const match = newIdea.match(URL_REGEX);
    const url = match ? match[0] : null;

    // URL removed/cleared — drop existing preview.
    if (!url) {
      lastLookedUpUrl.current = null;
      setMetadata(null);
      setIsLookingUp(false);
      return;
    }

    // Already looked up this exact URL — skip.
    if (url === lastLookedUpUrl.current) return;

    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      setIsLookingUp(true);
      const data = await fetchUrlMetadata(url);
      lastLookedUpUrl.current = url;
      setIsLookingUp(false);
      setMetadata(data);
    }, 500);

    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [newIdea]);

  const loadIdeas = async () => {
    setIsLoading(true);
    const data = await fetchIdeas();
    setIdeas(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.trim() || !authorName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitIdea(newIdea.trim(), authorName.trim(), metadata);

    if (result.success) {
      setNewIdea('');
      setMetadata(null);
      lastLookedUpUrl.current = null;
      setShowSuccess(true);
      await loadIdeas();
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setSubmitError(result.error || 'Kunne ikke indsende idé');
    }

    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Parse description — supports both the new JSON format and the legacy HTML format.
  type ParsedIdea = {
    text: string;
    author: string;
    url?: string;
    image?: string | null;
    title?: string;
    siteName?: string;
  };

  const parseIdea = (idea: IdeaTodo): ParsedIdea => {
    const fallbackText = idea.title.replace('💡 IDÉBOKS: ', '');
    const desc = idea.description;
    if (!desc) return { text: fallbackText, author: 'Ukendt' };

    // Try JSON first.
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === 'object') {
        return {
          text:
            parsed.shortDescription ||
            parsed.description ||
            parsed.longDescription ||
            fallbackText,
          author: parsed.submittedBy || 'Ukendt',
          url: parsed.url || undefined,
          image: parsed.image || null,
          title: parsed.title || undefined,
          siteName: parsed.siteName || undefined,
        };
      }
    } catch {
      // fall through to HTML parsing
    }

    const authorMatch = desc.match(/<strong>Fra:<\/strong>\s*([^<(]+)/);
    const textMatch = desc.match(/<strong>Idé:<\/strong>\s*([^<]+)/);
    return {
      text: textMatch ? textMatch[1].trim() : fallbackText,
      author: authorMatch ? authorMatch[1].trim() : 'Ukendt',
    };
  };

  const pendingIdeas = ideas.filter((i) => !i.resolved);
  const resolvedIdeas = ideas.filter((i) => i.resolved);

  const renderPreview = () => {
    if (isLookingUp) {
      return (
        <div className="mt-3 flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Henter link-preview...</span>
        </div>
      );
    }
    if (!metadata || metadata.error) {
      if (metadata?.error) {
        return (
          <div className="mt-3 text-xs text-gray-500">
            Kunne ikke hente preview: {metadata.error}
          </div>
        );
      }
      return null;
    }
    return (
      <div className="mt-3 relative bg-battle-dark border border-white/10 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setMetadata(null);
            lastLookedUpUrl.current = null;
          }}
          aria-label="Fjern preview"
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {metadata.image && (
          <img
            src={metadata.image}
            alt=""
            className="w-full h-40 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs text-battle-orange mb-1">
            <LinkIcon className="w-3 h-3" />
            <span className="truncate">
              {metadata.siteName || new URL(metadata.url).hostname}
            </span>
          </div>
          {metadata.title && (
            <div className="text-sm font-semibold text-white line-clamp-2">
              {metadata.title}
            </div>
          )}
          {metadata.description && (
            <div className="text-xs text-gray-400 line-clamp-2 mt-1">
              {metadata.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-battle-black">
      {/* Header */}
      <div className="bg-battle-dark border-b border-battle-orange/30 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Ideer & Forslag</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Del dine ideer til forbedringer — de bedste forslag bliver implementeret
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Submit form */}
        <form onSubmit={handleSubmit} className="bg-battle-grey rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Indsend en idé</h2>

          <div className="space-y-3">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Dit navn"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange"
            />
            <textarea
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="Beskriv din idé — indsæt evt. et link, så hentes preview automatisk"
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
              maxLength={500}
              rows={3}
            />
            {renderPreview()}
            <button
              type="submit"
              disabled={!newIdea.trim() || !authorName.trim() || isSubmitting}
              className="w-full px-4 py-3 bg-battle-orange hover:bg-battle-orangeLight disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send idé
            </button>
          </div>

          {showSuccess && (
            <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Din idé er sendt — tak!</span>
            </div>
          )}

          {submitError && (
            <div className="mt-4 text-red-400 text-sm">{submitError}</div>
          )}
        </form>

        {/* Ideas list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isLoading
              ? 'Henter ideer...'
              : ideas.length > 0
                ? `${pendingIdeas.length} aktive idé${pendingIdeas.length !== 1 ? 'er' : ''}`
                : 'Ingen ideer endnu — vær den første!'}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-battle-orange animate-spin" />
            </div>
          ) : (
            <>
              {pendingIdeas.map((idea) => {
                const parsed = parseIdea(idea);
                return (
                  <div
                    key={idea.id}
                    className="bg-battle-grey rounded-xl p-5 border-l-4 border-yellow-500/50"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-relaxed">
                          {parsed.text}
                        </p>
                        {parsed.url && (
                          <a
                            href={parsed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex gap-3 bg-battle-dark rounded-lg overflow-hidden border border-white/10 hover:border-battle-orange/50 transition-colors"
                          >
                            {parsed.image ? (
                              <img
                                src={parsed.image}
                                alt=""
                                className="w-20 h-20 object-cover flex-shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-battle-black">
                                <ImageIcon className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 py-2 pr-3">
                              <div className="flex items-center gap-1 text-xs text-battle-orange">
                                <LinkIcon className="w-3 h-3" />
                                <span className="truncate">
                                  {parsed.siteName || new URL(parsed.url).hostname}
                                </span>
                              </div>
                              {parsed.title && (
                                <div className="text-xs text-white font-medium line-clamp-2 mt-0.5">
                                  {parsed.title}
                                </div>
                              )}
                            </div>
                          </a>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1 text-gray-400">
                            <User className="w-3 h-3" />
                            {parsed.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(idea.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {resolvedIdeas.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 mt-8">
                    Behandlede ideer ({resolvedIdeas.length})
                  </h3>
                  {resolvedIdeas.map((idea) => {
                    const parsed = parseIdea(idea);
                    return (
                      <div
                        key={idea.id}
                        className="bg-battle-grey rounded-xl p-5 border-l-4 border-green-500/50 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm leading-relaxed">
                              {parsed.text}
                            </p>
                            {parsed.url && (
                              <a
                                href={parsed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-1 text-xs text-battle-orange hover:underline"
                              >
                                <LinkIcon className="w-3 h-3" />
                                {parsed.siteName || new URL(parsed.url).hostname}
                              </a>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1 text-gray-400">
                                <User className="w-3 h-3" />
                                {parsed.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(idea.created_at)}
                              </span>
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Behandlet
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
