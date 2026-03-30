import { extractYouTubeId } from '../lib/videoUtils';

const YouTubeEmbed = ({ url }: { url: string }) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  return (
    <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden bg-black">
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default YouTubeEmbed;
