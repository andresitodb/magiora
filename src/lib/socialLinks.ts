// Maps social network keys to URL builders + display labels.
// Used in public profile + ContactEditor.

interface SocialNetwork {
  label: string;
  baseUrl: string;
  // Hint shown in editor (e.g. "@yourname" or "Your IMDb name URL")
  hint: string;
}

const NETWORKS: Record<string, SocialNetwork> = {
  instagram: { label: 'Instagram', baseUrl: 'https://instagram.com/', hint: '@yourname or full URL' },
  twitter: { label: 'X', baseUrl: 'https://x.com/', hint: '@yourname or full URL' },
  x: { label: 'X', baseUrl: 'https://x.com/', hint: '@yourname or full URL' },
  imdb: { label: 'IMDb', baseUrl: 'https://www.imdb.com/name/', hint: 'nm1234567 or full URL' },
  vimeo: { label: 'Vimeo', baseUrl: 'https://vimeo.com/', hint: 'yourname or full URL' },
  youtube: { label: 'YouTube', baseUrl: 'https://www.youtube.com/@', hint: '@channel or full URL' },
  linkedin: { label: 'LinkedIn', baseUrl: 'https://www.linkedin.com/in/', hint: 'yourname or full URL' },
  tiktok: { label: 'TikTok', baseUrl: 'https://www.tiktok.com/@', hint: '@yourname or full URL' },
  facebook: { label: 'Facebook', baseUrl: 'https://www.facebook.com/', hint: 'yourname or full URL' },
  spotify: { label: 'Spotify', baseUrl: 'https://open.spotify.com/artist/', hint: 'artist URL' },
  soundcloud: { label: 'SoundCloud', baseUrl: 'https://soundcloud.com/', hint: 'yourname or full URL' },
  bandcamp: { label: 'Bandcamp', baseUrl: 'https://', hint: 'yourname.bandcamp.com or full URL' },
};

export function getSocialLabel(network: string): string {
  return NETWORKS[network.toLowerCase()]?.label ?? network[0].toUpperCase() + network.slice(1);
}

export function buildSocialUrl(network: string, value: string): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();

  // If already a full URL, use it as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const pattern = NETWORKS[network.toLowerCase()];
  if (!pattern) {
    // Unknown network — best-effort: if it looks like a domain, prepend https://
    if (trimmed.includes('.')) return `https://${trimmed}`;
    return null;
  }

  // Strip leading @ if user typed it (we add it back via baseUrl where needed)
  const cleanValue = trimmed.replace(/^@/, '');
  return pattern.baseUrl + cleanValue;
}

export function getSocialHint(network: string): string {
  return NETWORKS[network.toLowerCase()]?.hint ?? 'username or full URL';
}

export const KNOWN_NETWORKS = Object.keys(NETWORKS);
