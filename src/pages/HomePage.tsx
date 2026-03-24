import { useState, useEffect } from 'react';
import {
  Lightbulb,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  User,
} from 'lucide-react';
import { fetchIdeas, submitIdea, IdeaTodo } from '../lib/supabase';

const HomePage = () => {
  const [ideas, setIdeas] = useState<IdeaTodo[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadIdeas();
  }, []);

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

    const result = await submitIdea(newIdea.trim(), authorName.trim());

    if (result.success) {
      setNewIdea('');
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

  const parseAuthor = (description: string | null): string => {
    if (!description) return 'Ukendt';
    const match = description.match(/<strong>Fra:<\/strong>\s*([^<(]+)/);
    return match ? match[1].trim() : 'Ukendt';
  };

  const parseIdeaText = (description: string | null, title: string): string => {
    if (!description) return title.replace('💡 IDÉBOKS: ', '');
    const match = description.match(/<strong>Idé:<\/strong>\s*([^<]+)/);
    return match ? match[1].trim() : title.replace('💡 IDÉBOKS: ', '');
  };

  const pendingIdeas = ideas.filter((i) => !i.resolved);
  const resolvedIdeas = ideas.filter((i) => i.resolved);

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
              placeholder="Beskriv din idé eller forslag..."
              className="w-full bg-battle-dark border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange resize-none"
              maxLength={500}
              rows={3}
            />
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
              {pendingIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-battle-grey rounded-xl p-5 border-l-4 border-yellow-500/50"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-relaxed">
                        {parseIdeaText(idea.description, idea.title)}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1 text-gray-400">
                          <User className="w-3 h-3" />
                          {parseAuthor(idea.description)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(idea.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {resolvedIdeas.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 mt-8">
                    Behandlede ideer ({resolvedIdeas.length})
                  </h3>
                  {resolvedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="bg-battle-grey rounded-xl p-5 border-l-4 border-green-500/50 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm leading-relaxed">
                            {parseIdeaText(idea.description, idea.title)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1 text-gray-400">
                              <User className="w-3 h-3" />
                              {parseAuthor(idea.description)}
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
                  ))}
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
