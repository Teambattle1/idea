import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  ExternalLink,
  Package,
  Pencil,
  Trash2,
  Loader2,
  Video,
} from 'lucide-react';
import { fetchActivity, deleteActivity } from '../lib/supabase';
import { Activity, DIFFICULTY_LABELS, LOCATION_LABELS } from '../types';
import Header from '../components/Header';
import YouTubeEmbed from '../components/YouTubeEmbed';
import ImageGallery from '../components/ImageGallery';
import TagBadge from '../components/TagBadge';
import ShareButton from '../components/ShareButton';

const ActivityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) loadActivity(id);
  }, [id]);

  const loadActivity = async (activityId: string) => {
    setIsLoading(true);
    const data = await fetchActivity(activityId);
    setActivity(data);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await deleteActivity(id);
    if (result.success) navigate('/');
  };

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

  if (!activity) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">Aktivitet ikke fundet</p>
          <Link to="/" className="text-battle-orange hover:underline">
            Tilbage til oversigten
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle aktiviteter
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton path={`/activity/${activity.id}`} />
            <Link
              to={`/edit/${activity.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Rediger
            </Link>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Bekræft slet
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-white/10 text-gray-300 rounded-lg text-sm"
                >
                  Annuller
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{activity.title}</h1>
          {activity.shortDescription && (
            <p className="text-gray-400 text-lg">{activity.shortDescription}</p>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
          {activity.duration && (
            <span className="flex items-center gap-1.5 bg-battle-grey px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4" />
              {activity.duration}
            </span>
          )}
          {activity.groupSize && (
            <span className="flex items-center gap-1.5 bg-battle-grey px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4" />
              {activity.groupSize} personer
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-battle-grey px-3 py-1.5 rounded-lg">
            <MapPin className="w-4 h-4" />
            {LOCATION_LABELS[activity.location]}
          </span>
          <span
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              activity.difficulty === 'let'
                ? 'bg-green-500/20 text-green-400'
                : activity.difficulty === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            {DIFFICULTY_LABELS[activity.difficulty]}
          </span>
          <span className="text-xs text-gray-600">
            af {activity.author} ·{' '}
            {new Date(activity.createdAt).toLocaleDateString('da-DK', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Tags */}
        {activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activity.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* YouTube */}
        {activity.youtubeUrl && (
          <div className="mb-6">
            <YouTubeEmbed url={activity.youtubeUrl} />
          </div>
        )}

        {/* Video */}
        {activity.videoUrl && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Video className="w-4 h-4" />
              Videoklip
            </div>
            <video
              src={activity.videoUrl}
              controls
              className="w-full rounded-xl bg-black"
              preload="metadata"
            />
          </div>
        )}

        {/* Images */}
        {activity.images.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={activity.images} />
          </div>
        )}

        {/* Long description */}
        {activity.longDescription && (
          <div className="bg-battle-grey rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-white font-semibold mb-3">Beskrivelse</h2>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {activity.longDescription}
            </div>
          </div>
        )}

        {/* Materials */}
        {activity.materials.length > 0 && (
          <div className="bg-battle-grey rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Materialer
            </h2>
            <ul className="space-y-1.5">
              {activity.materials.map((mat, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {mat}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Links */}
        {activity.links.length > 0 && (
          <div className="bg-battle-grey rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-white font-semibold mb-3">Links & Ressourcer</h2>
            <div className="space-y-2">
              {activity.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-battle-orange hover:text-battle-orangeLight transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDetailPage;
