import { parseVideoUrl } from '@/lib/videoEmbed';
import type { Accent } from '@/lib/profile_themes';

export default function VideoEmbed({
  url,
  label,
  accent,
}: {
  url: string;
  label?: string;
  accent: Accent;
}) {
  const info = parseVideoUrl(url);

  if (info.embedUrl) {
    return (
      <div className="space-y-2">
        {label && (
          <p className="font-serif italic text-sm" style={{ color: accent.textMuted }}>
            {label}
          </p>
        )}
        <div
          className="relative w-full overflow-hidden rounded-md"
          style={{
            paddingBottom: '56.25%', // 16:9
            backgroundColor: accent.accentSoft,
          }}
        >
          <iframe
            src={info.embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={label ?? 'Video'}
          />
        </div>
      </div>
    );
  }

  // Fallback: plain link
  return (
    <div>
      {label && (
        <p className="font-serif italic text-sm mb-1" style={{ color: accent.textMuted }}>
          {label}
        </p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline break-all"
        style={{ color: accent.accent }}
      >
        {url} ↗
      </a>
    </div>
  );
}
