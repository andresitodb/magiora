import { buildSocialUrl, getSocialLabel } from '@/lib/socialLinks';
import type { Accent } from '@/lib/profile_themes';

const ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  ),
  twitter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  imdb: (
    <svg width="22" height="14" viewBox="0 0 32 16" fill="currentColor">
      <path d="M1 2h4v12h-4zM6 2h5l1.5 7l1.5 -7h5v12h-3.5v-7l-1.5 7h-2l-1.5 -7v7h-4.5zM18 2h5c2 0 3 1 3 3v6c0 2 -1 3 -3 3h-5zm3.5 3v6h1c0.5 0 0.5 -0.3 0.5 -0.5v-5c0 -0.3 -0.1 -0.5 -0.5 -0.5z" />
    </svg>
  ),
  vimeo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z" />
    </svg>
  ),
  youtube: (
    <svg width="16" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
    </svg>
  ),
  facebook: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  spotify: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.94-.6-.12-.421.18-.84.6-.94 4.561-1.021 8.52-.6 11.64 1.32.42.18.479.659.282 1.121zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.561.3z" />
    </svg>
  ),
  soundcloud: (
    <svg width="22" height="14" viewBox="0 0 32 18" fill="currentColor">
      <path d="M2 12c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zm3-2c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1s1-.4 1-1v-4c0-.6-.4-1-1-1zm3-1c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1s1-.4 1-1V10c0-.6-.4-1-1-1zm3-2c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1s1-.4 1-1V8c0-.6-.4-1-1-1zm15 2c-.5 0-1 .1-1.4.3-.4-2.4-2.5-4.3-5-4.3-1 0-2 .3-2.7.8-.3.2-.4.4-.4.7v10.5c0 .3.2.5.5.5h9c2.2 0 4-1.8 4-4s-1.7-4-4-4z" />
    </svg>
  ),
};

export default function SocialLinksList({
  social,
  accent,
}: {
  social: Record<string, string>;
  accent: Accent;
}) {
  const entries = Object.entries(social).filter(([, value]) => value && value.trim());
  if (entries.length === 0) return null;

  return (
    <ul className="space-y-3">
      {entries.map(([network, value]) => {
        const url = buildSocialUrl(network, value);
        const label = getSocialLabel(network);
        const icon = ICONS[network.toLowerCase()];

        if (!url) {
          // Couldn't build a URL — show as plain text
          return (
            <li key={network} className="font-serif">
              <span className="capitalize italic text-sm" style={{ color: accent.textMuted }}>
                {label}:{' '}
              </span>
              <span style={{ color: accent.text }}>{value}</span>
            </li>
          );
        }

        return (
          <li key={network}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 group hover:opacity-80 transition-opacity"
              style={{ color: accent.accent }}
            >
              {icon && <span className="flex-shrink-0">{icon}</span>}
              <span className="font-serif text-base group-hover:underline">{label} ↗</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
