import MagioraMark from '@/components/brand/MagioraMark';

export default function ProfilePoweredByFooter({
  surface,
  compact = true,
  homeHref = '/',
  borderColor,
}: {
  surface: 'light' | 'dark';
  compact?: boolean;
  homeHref?: string;
  borderColor?: string;
}) {
  const foreground = surface === 'dark' ? '#F7F5F1' : '#292524';
  const secondary = surface === 'dark' ? '#C9C5BF' : '#6B6660';

  return (
    <footer
      className={`border-t px-5 text-center ${compact ? 'py-8' : 'py-10'}`}
      style={{ borderColor }}
      data-profile-footer-surface={surface}
    >
      <a
        href={homeHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Open Magiora Home in a new tab"
        className="inline-flex flex-col items-center gap-1.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{ color: foreground }}
      >
        <span className="inline-flex items-center gap-2" aria-hidden="true">
          <MagioraMark decorative className="h-6 w-[1.6rem] text-[#DAAF37]" />
          <span className="font-serif text-sm font-medium tracking-[0.12em]">MAGIORA</span>
        </span>
        <span className="block text-xs" style={{ color: secondary }}>Powered by Magiora</span>
      </a>
    </footer>
  );
}
