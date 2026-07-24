'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({
  links,
  variant,
}: {
  links: { href: string; label: string; icon?: ReactNode; exact?: boolean; activePrefixes?: string[] }[];
  variant: 'public' | 'admin';
}) {
  const pathname = usePathname();
  return links.map((link) => {
    const routeActive = link.exact || link.href === '/'
      ? pathname === '/'
        ? link.href === '/'
        : pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);
    const active = routeActive || link.activePrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    const base = 'inline-flex items-center gap-1.5 rounded-sm border-b text-sm whitespace-nowrap transition-colors';
    const state = variant === 'admin'
      ? active
        ? 'border-stone-100 text-white'
        : 'border-transparent text-stone-300 hover:text-white'
      : active
        ? 'border-[var(--magiora-brand)] text-[var(--magiora-brand)]'
        : 'border-transparent text-stone-700 hover:text-[var(--magiora-brand)]';

    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? 'page' : undefined}
        className={`${base} ${state}`}
      >
        {link.icon && <span className="shrink-0" aria-hidden="true">{link.icon}</span>}
        {link.label}
      </Link>
    );
  });
}
