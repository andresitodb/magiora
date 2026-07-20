import type { Metadata } from 'next';

const DEFAULT_DESCRIPTION = 'Where ideas become productions.';
const DEFAULT_SITE_URL = 'http://localhost:3000';

export function getSiteUrl(): URL {
  try {
    const configured = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
    const url = new URL(configured);
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function getCanonicalUrl(pathname: string): URL {
  const normalizedPath = `/${pathname}`.replace(/\/+/g, '/');
  return new URL(normalizedPath, getSiteUrl());
}

export function metadataText(
  value: unknown,
  fallback = DEFAULT_DESCRIPTION,
  maxLength = 160
): string {
  const source = typeof value === 'string' ? value : '';
  const clean = source
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  const safeFallback = fallback.replace(/\s+/g, ' ').trim();
  const text = clean || safeFallback;
  const characters = Array.from(text);
  if (characters.length <= maxLength) return text;

  const shortened = characters.slice(0, Math.max(1, maxLength - 1)).join('');
  const lastSpace = shortened.lastIndexOf(' ');
  const boundary =
    lastSpace >= Math.floor(maxLength * 0.6)
      ? shortened.slice(0, lastSpace)
      : shortened;
  return `${boundary.trimEnd()}…`;
}

export function publicImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (
      process.env.NODE_ENV === 'production' &&
      ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function entityMetadata({
  title,
  description,
  pathname,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  pathname: string;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
}): Metadata {
  const safeTitle = metadataText(title, 'Magiora', 90);
  const safeDescription = metadataText(description);
  const canonical = getCanonicalUrl(pathname);
  const absoluteTitle = safeTitle === 'Magiora' ? 'Magiora' : `${safeTitle} | Magiora`;
  const validImage = publicImageUrl(image);
  const images = validImage ? [{ url: validImage, alt: safeTitle }] : undefined;

  return {
    title: { absolute: absoluteTitle },
    description: safeDescription,
    alternates: { canonical },
    openGraph: {
      type,
      siteName: 'Magiora',
      locale: 'en_US',
      title: absoluteTitle,
      description: safeDescription,
      url: canonical,
      images,
    },
    twitter: {
      card: validImage ? 'summary_large_image' : 'summary',
      title: absoluteTitle,
      description: safeDescription,
      images: validImage ? [validImage] : undefined,
    },
  };
}

export function unavailableMetadata(pathname: string): Metadata {
  const metadata = entityMetadata({
    title: 'Magiora',
    description: DEFAULT_DESCRIPTION,
    pathname,
  });
  return {
    ...metadata,
    robots: { index: false, follow: false },
  };
}
