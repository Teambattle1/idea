import { Link } from 'react-router-dom';
import { Clock, Users, MapPin, Play, Image as ImageIcon, FileText } from 'lucide-react';
import { Activity, COUNTRIES, DIFFICULTY_LABELS, LOCATION_LABELS } from '../types';
import { getYouTubeThumbnail } from '../lib/videoUtils';
import TagBadge from './TagBadge';

function countryFlag(code: string): string {
  if (COUNTRIES[code]?.flag) return COUNTRIES[code].flag;
  const upper = code.toUpperCase();
  if (upper.length === 2) {
    return String.fromCodePoint(...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  }
  return '';
}

const ActivityCard = ({ activity }: { activity: Activity }) => {
  const fileCount = activity.materials.filter((m) => m.url).length;
  const hasVideo = !!activity.youtubeUrl || !!activity.videoUrl;
  const youtubeThumbnail = activity.youtubeUrl ? getYouTubeThumbnail(activity.youtubeUrl) : null;

  // Determine card thumbnail: first image, or YouTube thumbnail
  const thumbnail = activity.images.length > 0 ? activity.images[0] : youtubeThumbnail;

  return (
    <div className="bg-battle-grey rounded-xl border border-white/10 hover:border-battle-orange/30 transition-all group">
      {/* Thumbnail: image or YouTube preview */}
      {thumbnail && (
        <Link to={`/activity/${activity.id}`}>
          <div className="aspect-video rounded-t-xl overflow-hidden bg-battle-dark relative">
            <img
              src={thumbnail}
              alt={activity.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {activity.images.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {activity.images.length}
              </span>
            )}
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>
        </Link>
      )}

      <div className="p-5">
        <Link to={`/activity/${activity.id}`}>
          <h3 className="text-white font-semibold text-lg mb-0.5 group-hover:text-battle-orange transition-colors">
            {activity.title}
          </h3>
        </Link>

        {activity.contact?.company && (
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            {activity.contact.country && (
              <span>{countryFlag(activity.contact.country)}</span>
            )}
            {activity.contact.company}
          </p>
        )}

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {activity.shortDescription}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {activity.duration}
            </span>
          )}
          {activity.groupSize && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {activity.groupSize} ppl
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {LOCATION_LABELS[activity.location]}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
              activity.difficulty === 'let'
                ? 'bg-green-500/20 text-green-400'
                : activity.difficulty === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            {DIFFICULTY_LABELS[activity.difficulty]}
          </span>
          {hasVideo && !thumbnail && (
            <span className="flex items-center gap-1 text-red-400">
              <Play className="w-3.5 h-3.5" />
              Video
            </span>
          )}
          {fileCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <FileText className="w-3.5 h-3.5" />
              {fileCount} file{fileCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {activity.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {activity.tags.length > 4 && (
              <span className="text-xs text-gray-500">+{activity.tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-gray-600">by {activity.author}</span>
          <Link
            to={`/activity/${activity.id}`}
            className="text-xs text-battle-orange hover:text-battle-orangeLight transition-colors"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
