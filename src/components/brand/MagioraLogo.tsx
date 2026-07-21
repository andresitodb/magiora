import MagioraMark from './MagioraMark';

export default function MagioraLogo({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-hidden="true">
      <MagioraMark decorative className="h-6 w-9 shrink-0 text-[var(--magiora-brand)]" />
      {!compact && (
        <span
          className={`hidden min-[420px]:inline font-serif text-[1.35rem] font-medium leading-none tracking-[-0.015em] ${
            inverse ? 'text-white' : 'text-[var(--magiora-text)]'
          }`}
        >
          Magiora
        </span>
      )}
    </span>
  );
}
