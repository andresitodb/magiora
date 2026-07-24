import { createClient } from '@/lib/supabase/server';
import { getT, getLocale } from '@/lib/i18n';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import GlobalSearch from '@/components/GlobalSearch';
import NavMobileMenu from '@/components/NavMobileMenu';
import NotificationsBell from '@/components/NotificationsBell';
import MagioraLogo from '@/components/brand/MagioraLogo';
import Link from 'next/link';
import NavLinks from '@/components/NavLinks';

function UserOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

type NavProfile = {
  display_name: string;
  slug: string | null;
  plan: string | null;
  is_admin: boolean;
  headshot_url: string | null;
  verified: boolean | null;
  role_category: string | null;
};

export default async function Nav({
  variant = 'public',
}: {
  variant?: 'public' | 'dashboard' | 'admin';
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: NavProfile | null = null;
  let unreadCount = 0;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, slug, plan, is_admin, headshot_url, verified, role_category')
      .eq('id', user.id)
      .single();
    profile = data;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .is('read_at', null);
    unreadCount = count ?? 0;
  }

  const t = await getT();
  const locale = await getLocale();

  const isAdmin = variant === 'admin';
  const isAuthenticatedNavigation = variant === 'dashboard';

  const tr = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const publicLinks = [
    { href: '/', label: tr('nav.home', 'Home') },
    { href: '/directory', label: tr('nav.directory', 'Directory') },
    { href: '/projects', label: 'Projects' },
    { href: '/events', label: tr('nav.events', 'Events') },
    { href: '/stories', label: 'Spotlight' },
    { href: '/pricing', label: tr('nav.pricing', 'Pricing') },
    { href: '/casting-calls', label: 'Casting' },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/featured', label: 'Featured' },
    { href: '/admin/members', label: 'Members' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/casting-calls', label: 'Calls' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/stories', label: 'Spotlight' },
    { href: '/admin/newsletter', label: 'Newsletter' },
  ];

  const dashboardLinks = [
    { href: '/', label: 'Home', exact: true },
    { href: '/dashboard', label: 'Dashboard', exact: true },
    { href: '/dashboard/profile', label: 'Profile' },
    { href: '/dashboard/projects', label: 'Projects' },
    { href: '/dashboard/casting', label: 'Casting', activePrefixes: ['/casting-calls'] },
    { href: '/dashboard/applications', label: 'Applications' },
  ];

  const links = isAdmin ? adminLinks : isAuthenticatedNavigation ? dashboardLinks : publicLinks;

  const logoHref = '/';

  return (
    <nav className={isAdmin ? 'border-b border-stone-700 bg-stone-900' : 'border-b border-[var(--magiora-border)] bg-white'}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2 md:gap-4">
        <Link
          href={logoHref}
          aria-label="Magiora home"
          className="shrink-0 rounded-sm"
        >
          <MagioraLogo inverse={isAdmin} />
          {isAdmin && (
            <span className="text-stone-400 italic text-xs md:text-sm ml-2 hidden sm:inline">editor&apos;s desk</span>
          )}
        </Link>

        <div className="hidden lg:flex items-center justify-center gap-4 flex-1 min-w-0 overflow-x-auto">
          <NavLinks links={links} variant={isAdmin ? 'admin' : 'public'} />
        </div>

        <div className="hidden lg:flex items-center gap-2 lg:gap-3 shrink-0">
          {!isAdmin && <GlobalSearch />}
          {user && !isAdmin && <NotificationsBell unreadCount={unreadCount} />}
          <LocaleSwitcher currentLocale={locale} />

          {user && profile ? (
            <>
              {!isAdmin && profile.slug && (
                <Link
                  href={`/m/${profile.slug}`}
                  className="flex items-center gap-2 group"
                  title="View public profile"
                >
                  {profile.headshot_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={profile.headshot_url}
                      alt={profile.display_name ?? ''}
                      className="w-8 h-8 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] text-xs font-medium">
                      {(profile.display_name?.[0] ?? '?').toUpperCase()}
                    </div>
                  )}
                </Link>
              )}

              {!isAdmin && (
                <>
                  {variant === 'public' && (
                    <Link
                      href="/dashboard/applications"
                      className="text-xs font-medium text-stone-600 hover:text-[#712B13] whitespace-nowrap"
                    >
                      My Applications
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="k-button k-button-primary min-h-0 px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap"
                  >
                    {tr('nav.dashboard', 'Dashboard')}
                  </Link>
                </>
              )}

              {!isAdmin && profile.is_admin && (
                <Link
                  href="/admin"
                  className="bg-stone-900 text-white px-2.5 py-1 rounded text-xs font-medium hover:bg-stone-700 whitespace-nowrap"
                  title="Go to admin"
                >
                  Admin
                </Link>
              )}
              {isAdmin && (
                <Link href="/dashboard" className="text-stone-300 hover:text-white text-sm italic whitespace-nowrap">
                  ← Dashboard
                </Link>
              )}

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className={`${isAdmin ? 'text-stone-400' : 'text-stone-500'} hover:text-[#712B13] text-sm cursor-pointer whitespace-nowrap`}
                >
                  {tr('nav.sign_out', 'Sign out')}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[var(--magiora-brand)] hover:text-[var(--magiora-brand-hover)] text-sm font-medium whitespace-nowrap"
              >
                <UserOutlineIcon />
                {tr('nav.sign_in', 'Sign in')}
              </Link>
              <Link
                href="/signup"
                className="k-button k-button-primary min-h-0 px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap"
              >
                {tr('nav.sign_up', 'Join')}
              </Link>
            </>
          )}
        </div>

        <NavMobileMenu
          links={links}
          isAdmin={isAdmin}
          locale={locale}
          isAuthed={!!user}
          userProfile={profile}
          signInLabel={tr('nav.sign_in', 'Sign in')}
          signUpLabel={tr('nav.sign_up', 'Join')}
          signOutLabel={tr('nav.sign_out', 'Sign out')}
          showDashboardShortcut={variant === 'public'}
        />
      </div>
    </nav>
  );
}
