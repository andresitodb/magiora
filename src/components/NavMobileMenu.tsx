'use client';

import { useState } from 'react';
import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';

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
}: {
  links: { href: string; label: string }[];
  isAdmin: boolean;
  locale: 'en' | 'es';
  isAuthed: boolean;
  userProfile: UserProfile | null;
  signInLabel: string;
  signUpLabel: string;
  signOutLabel: string;
}) {
  const [open, setOpen] = useState(false);

  const linkClass = isAdmin
    ? 'block py-2.5 text-stone-300 hover:text-white font-serif'
    : 'block py-2.5 text-stone-700 hover:text-[#712B13] font-serif';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`md:hidden p-2 rounded-md cursor-pointer ${isAdmin ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-100'}`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
          <div className={`md:hidden fixed top-0 right-0 bottom-0 w-72 z-50 overflow-y-auto ${isAdmin ? 'bg-stone-900' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <p className={`font-serif text-lg font-medium ${isAdmin ? 'text-white' : 'text-stone-900'}`}>
                  Menu
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className={`p-1.5 rounded cursor-pointer ${isAdmin ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-100'}`}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <line x1="4" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    <line x1="14" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {isAuthed && userProfile && !isAdmin && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block bg-[#712B13] text-white text-center py-2.5 px-4 rounded-md font-medium mb-4 hover:bg-[#4A1B0C]"
                >
                  Dashboard
                </Link>
              )}

              <nav className="border-t border-stone-200 py-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    {link.label}
                  </Link>
                ))}
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
                        className="block text-center py-2.5 border border-[#712B13] text-[#712B13] rounded-md font-medium"
                      >
                        {signInLabel}
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setOpen(false)}
                        className="block bg-[#712B13] text-white text-center py-2.5 px-4 rounded-md font-medium"
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
