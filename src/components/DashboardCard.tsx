import Link from 'next/link';

interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string | number;
  actionLabel: string;
  secondaryAction?: {
    href: string;
    label: string;
    icon: React.ReactNode;
  };
}

export default function DashboardCard({
  href,
  title,
  description,
  icon,
  badge,
  actionLabel,
  secondaryAction,
}: DashboardCardProps) {
  return (
    <article className="k-card flex min-h-36 h-full flex-col p-4 transition-colors hover:border-stone-300 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#712B13]/20 text-[#712B13]">
          {icon}
        </div>
        {badge != null && badge !== 0 && badge !== '' && (
          <span className="k-badge border border-[#712B13]/15 bg-[#FAEEDA] text-[#712B13]">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-medium">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
        {description}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
        <Link href={href} className="k-link text-sm font-medium">
          {actionLabel} <span aria-hidden="true">→</span>
        </Link>
        {secondaryAction && (
          <span className="group/profile-action relative">
            <Link
              href={secondaryAction.href}
              aria-label={secondaryAction.label}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:border-[#712B13]/40 hover:text-[#712B13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13]"
            >
              {secondaryAction.icon}
            </Link>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-40 -translate-x-1/2 rounded bg-stone-900 px-2 py-1 text-center text-xs text-white opacity-0 transition-opacity group-hover/profile-action:opacity-100 group-focus-within/profile-action:opacity-100"
            >
              {secondaryAction.label}
            </span>
          </span>
        )}
      </div>
    </article>
  );
}

// Icon set — inline SVG for editorial consistency.
export const DashboardIcons = {
  externalLink: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  projects: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M5 8h2" />
      <path d="M5 12h2" />
      <path d="M5 16h2" />
      <path d="M17 8h2" />
      <path d="M17 12h2" />
      <path d="M17 16h2" />
    </svg>
  ),
  matches: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4.5L6 21l1.5-7.5L2 9h7z" />
    </svg>
  ),
  applications: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  castingCalls: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 6l-1 5h16l-1-5z" />
      <path d="M4 11h16v9H4z" />
      <path d="M8 6l-1-3" />
      <path d="M16 6l1-3" />
      <path d="M12 6V3" />
    </svg>
  ),
  story: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};
