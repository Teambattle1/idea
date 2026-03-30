// Utility to extract YouTube video ID from any URL
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Detect if a URL is a video URL
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // YouTube
  if (/youtube\.com|youtu\.be/.test(lower)) return true;
  // Vimeo
  if (/vimeo\.com/.test(lower)) return true;
  // Direct video files
  if (/\.(mp4|webm|mov|avi|wmv|m4v)(\?|$)/i.test(lower)) return true;
  return false;
}

// Detect if URL is specifically YouTube
export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

// Scan text for video URLs
export function findVideoUrlsInText(text: string): { youtubeUrls: string[]; videoUrls: string[] } {
  const youtubeUrls: string[] = [];
  const videoUrls: string[] = [];

  // Find all URLs in text
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex) || [];

  for (const url of matches) {
    if (isYouTubeUrl(url)) {
      youtubeUrls.push(url);
    } else if (isVideoUrl(url)) {
      videoUrls.push(url);
    }
  }

  return { youtubeUrls, videoUrls };
}
