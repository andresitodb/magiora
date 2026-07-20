import Link from 'next/link';

interface DashboardCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string | number;
  accent?: 'coral' | 'amber' | 'green' | 'blue' | 'stone';
}

const ACCENT_STYLES: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  coral: { bg: 'hover:border-[#712B13]', iconBg: 'bg-[#FAECE7]', iconColor: 'text-[#712B13]' },
  amber: { bg: 'hover:border-amber-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-700' },
  green: { bg: 'hover:border-green-700', iconBg: 'bg-green-50', iconColor: 'text-green-700' },
  blue: { bg: 'hover:border-blue-700', iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
  stone: { bg: 'hover:border-stone-600', iconBg: 'bg-stone-100', iconColor: 'text-stone-700' },
};

export default function DashboardCard({
  href,
  title,
  description,
  icon,
  badge,
  accent = 'coral',
}: DashboardCardProps) {
  const style = ACCENT_STYLES[accent];

  return (
    <Link
      href={href}
      className={`k-card k-card-interactive block p-5 ${style.bg} group h-full`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${style.iconBg} ${style.iconColor}`}>
          {icon}
        </div>
        {badge != null && badge !== 0 && badge !== '' && (
          <span className="k-badge bg-[#712B13] text-white">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-medium mb-1 group-hover:text-[#712B13] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-stone-500 italic font-serif leading-snug">
        {description}
      </p>
    </Link>
  );
}

// Icon set — inline SVG for editorial consistency.
export const DashboardIcons = {
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
