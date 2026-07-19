import Link from 'next/link';

type IconKind =
  | 'search'
  | 'inbox'
  | 'calendar'
  | 'camera'
  | 'star'
  | 'people'
  | 'application'
  | 'match'
  | 'folder';

export default function EmptyState({
  icon = 'inbox',
  title,
  body,
  action,
  ctaHref,
  ctaLabel,
}: {
  icon?: IconKind;
  title: string;
  body: string;
  action?: { href: string; label: string };
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const resolvedAction =
    action ?? (ctaHref && ctaLabel ? { href: ctaHref, label: ctaLabel } : undefined);

  return (
    <div className="bg-white border border-stone-200 rounded-md p-10 md:p-16 text-center">
      <div className="mx-auto w-24 h-24 mb-6 text-[#FAC775]">
        {renderIcon(icon)}
      </div>
      <h2 className="font-serif text-2xl font-medium mb-3">{title}</h2>
      <p className="font-serif italic text-stone-600 max-w-md mx-auto leading-relaxed mb-6">
        {body}
      </p>
      {resolvedAction && (
        <Link
          href={resolvedAction.href}
          className="inline-block bg-[#712B13] text-white py-2 px-5 rounded-md font-medium hover:bg-[#4A1B0C]"
        >
          {resolvedAction.label}
        </Link>
      )}
    </div>
  );
}

function renderIcon(kind: IconKind) {
  const stroke = 'stroke-[#993C1D]';

  switch (kind) {
    case 'search':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <circle cx="42" cy="42" r="22" className={stroke} strokeWidth="3" />
          <line x1="58" y1="58" x2="78" y2="78" className={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="38" cy="38" r="6" fill="#FAECE7" />
          <circle cx="48" cy="38" r="6" fill="#FAECE7" />
          <path d="M 38 50 Q 42 54 46 50" className={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'inbox':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect x="20" y="40" width="60" height="40" rx="4" className={stroke} strokeWidth="3" fill="#FAEEDA" />
          <path d="M 30 40 L 35 25 L 65 25 L 70 40" className={stroke} strokeWidth="3" fill="none" strokeLinejoin="round" />
          <line x1="35" y1="55" x2="65" y2="55" className={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="62" x2="55" y2="62" className={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect x="18" y="25" width="64" height="58" rx="4" className={stroke} strokeWidth="3" fill="#FAEEDA" />
          <line x1="18" y1="40" x2="82" y2="40" className={stroke} strokeWidth="3" />
          <line x1="32" y1="20" x2="32" y2="32" className={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="20" x2="68" y2="32" className={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="35" cy="55" r="3" fill="#993C1D" />
          <circle cx="50" cy="55" r="3" fill="#993C1D" />
          <circle cx="65" cy="55" r="3" fill="#993C1D" />
          <circle cx="35" cy="70" r="3" fill="#993C1D" />
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect x="15" y="32" width="70" height="48" rx="4" className={stroke} strokeWidth="3" fill="#FAEEDA" />
          <path d="M 38 32 L 42 22 L 58 22 L 62 32" className={stroke} strokeWidth="3" fill="none" strokeLinejoin="round" />
          <circle cx="50" cy="56" r="12" className={stroke} strokeWidth="3" />
          <circle cx="50" cy="56" r="6" fill="#993C1D" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path
            d="M 50 15 L 60 38 L 84 41 L 66 58 L 71 82 L 50 70 L 29 82 L 34 58 L 16 41 L 40 38 Z"
            className={stroke}
            strokeWidth="3"
            strokeLinejoin="round"
            fill="#FAEEDA"
          />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <circle cx="35" cy="38" r="11" className={stroke} strokeWidth="3" fill="#FAEEDA" />
          <circle cx="65" cy="38" r="11" className={stroke} strokeWidth="3" fill="#FAEEDA" />
          <path d="M 18 78 Q 18 60 35 60 Q 52 60 52 78" className={stroke} strokeWidth="3" fill="none" />
          <path d="M 48 78 Q 48 60 65 60 Q 82 60 82 78" className={stroke} strokeWidth="3" fill="none" />
        </svg>
      );
    case 'application':
      return renderIcon('inbox');
    case 'match':
      return renderIcon('search');
    case 'folder':
      return renderIcon('camera');
  }
}
