import { fetchActivities, updateActivity } from './supabase';
import { findVideoUrlsInText, isYouTubeUrl, isVideoUrl } from './videoUtils';

export interface ScanResult {
  id: string;
  title: string;
  foundYouTube: string | null;
  foundVideo: string | null;
  updated: boolean;
}

export async function scanAndUpdateVideoUrls(): Promise<ScanResult[]> {
  const activities = await fetchActivities();
  const results: ScanResult[] = [];

  for (const activity of activities) {
    // Skip if already has video URLs
    if (activity.youtubeUrl && activity.videoUrl) continue;

    let foundYouTube: string | null = null;
    let foundVideo: string | null = null;

    // 1. Check links for video URLs
    for (const link of activity.links) {
      if (!foundYouTube && isYouTubeUrl(link.url)) {
        foundYouTube = link.url;
      } else if (!foundVideo && isVideoUrl(link.url)) {
        foundVideo = link.url;
      }
    }

    // 2. Scan description text for video URLs
    if (!foundYouTube || !foundVideo) {
      const allText = [
        activity.shortDescription,
        activity.longDescription,
        activity.execution,
      ].join('\n');

      const found = findVideoUrlsInText(allText);
      if (!foundYouTube && found.youtubeUrls.length > 0) {
        foundYouTube = found.youtubeUrls[0];
      }
      if (!foundVideo && found.videoUrls.length > 0) {
        foundVideo = found.videoUrls[0];
      }
    }

    // 3. Check images array for video URLs (sometimes video URLs end up there)
    if (!foundYouTube || !foundVideo) {
      for (const img of activity.images) {
        if (!foundYouTube && isYouTubeUrl(img)) {
          foundYouTube = img;
        } else if (!foundVideo && isVideoUrl(img)) {
          foundVideo = img;
        }
      }
    }

    // Only update if we found something new
    const needsYouTube = foundYouTube && !activity.youtubeUrl;
    const needsVideo = foundVideo && !activity.videoUrl;

    if (needsYouTube || needsVideo) {
      const { id, createdAt, archived, ...data } = activity;
      if (needsYouTube) data.youtubeUrl = foundYouTube!;
      if (needsVideo) data.videoUrl = foundVideo!;

      await updateActivity(id, data);

      results.push({
        id,
        title: activity.title,
        foundYouTube: needsYouTube ? foundYouTube : null,
        foundVideo: needsVideo ? foundVideo : null,
        updated: true,
      });
    } else if (foundYouTube || foundVideo) {
      results.push({
        id: activity.id,
        title: activity.title,
        foundYouTube,
        foundVideo,
        updated: false,
      });
    }
  }

  return results;
}
