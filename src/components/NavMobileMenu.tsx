'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { usePathname } from 'next/navigation';

interface UserProfile {
  display_name: string;
  slug: string | null;
  headshot_url: string | null;
  is_admin: boolean;
}

export default function NavMobileMenu({
  links,
  isAdmin,
  locale,
  isAuthed,
  userProfile,
  signInLabel,
  signUpLabel,
  signOutLabel,
  showDashboardShortcut,
}: {
  links: { href: string; label: string; exact?: boolean; activePrefixes?: string[] }[];
  isAdmin: boolean;
  locale: 'en' | 'es';
  isAuthed: boolean;
  userProfile: UserProfile | null;
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
  showDashboardShortcut: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const linkClass = isAdmin
    ? 'block py-2.5 text-stone-300 hover:text-white font-serif'
    : 'block py-2.5 text-stone-700 hover:text-[#712B13] font-serif';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`lg:hidden min-w-11 min-h-11 p-2 rounded-md cursor-pointer ${isAdmin ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-100'}`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`lg:hidden fixed top-0 right-0 bottom-0 w-[min(18rem,100vw)] z-50 overflow-y-auto ${isAdmin ? 'bg-stone-900' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <p className={`font-serif text-lg font-medium ${isAdmin ? 'text-white' : 'text-stone-900'}`}>
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className={`min-w-11 min-h-11 p-1.5 rounded cursor-pointer ${isAdmin ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-100'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {isAuthed && userProfile && !isAdmin && showDashboardShortcut && (
                <div className="mb-4 grid gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="k-button k-button-primary w-full"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/applications"
                    onClick={() => setOpen(false)}
                    className="k-button k-button-secondary w-full"
                  >
                    My Applications
                  </Link>
                </div>
              )}

              <nav className="border-t border-stone-200 py-2">
                {links.map((link) => {
                  const routeActive = link.exact || link.href === '/'
                    ? pathname === '/'
                      ? link.href === '/'
                      : pathname === link.href
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  const active = routeActive || link.activePrefixes?.some(
                    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
                  );
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`${linkClass} ${active ? (isAdmin ? 'text-white underline underline-offset-4' : 'text-[var(--magiora-brand)] underline underline-offset-4') : ''}`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {isAuthed && userProfile && !isAdmin && userProfile.is_admin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block bg-stone-900 text-white text-center py-2 px-3 rounded text-sm font-medium mt-2 hover:bg-stone-700"
                >
                  Admin
                </Link>
              )}

              <div className={`mt-6 pt-6 border-t ${isAdmin ? 'border-stone-700' : 'border-stone-200'}`}>
                <LocaleSwitcher currentLocale={locale} />

                <div className="mt-4">
                  {isAuthed ? (
                    <form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className={`w-full text-left py-2 font-serif italic ${isAdmin ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-[#712B13]'} cursor-pointer`}
                      >
                        {signOutLabel}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="k-button k-button-secondary w-full"
                      >
                        {signInLabel}
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setOpen(false)}
                        className="k-button k-button-primary w-full"
                      >
                        {signUpLabel}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
