// Parse YouTube / Vimeo URLs into embed-friendly URLs.

export interface VideoEmbedInfo {
  provider: 'youtube' | 'vimeo' | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

export function parseVideoUrl(url: string): VideoEmbedInfo {
  if (!url) return { provider: null, embedUrl: null, thumbnailUrl: null };

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo: vimeo.com/123456789, vimeo.com/video/123456789, player.vimeo.com/video/123456789
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      thumbnailUrl: null, // would need Vimeo API call; skip
    };
  }

  return { provider: null, embedUrl: null, thumbnailUrl: null };
}

export function isEmbeddable(url: string): boolean {
  return parseVideoUrl(url).provider !== null;
}
