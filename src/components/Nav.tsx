import { createClient } from '@/lib/supabase/server';
import { getT, getLocale } from '@/lib/i18n';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import GlobalSearch from '@/components/GlobalSearch';
import NavMobileMenu from '@/components/NavMobileMenu';
import NotificationsBell from '@/components/NotificationsBell';
import Link from 'next/link';

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

  const tr = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const publicLinks = [
    { href: '/', label: tr('nav.home', 'Home') },
    { href: '/directory', label: tr('nav.directory', 'Directory') },
    { href: '/projects', label: 'Projects' },
    { href: '/casting-calls', label: 'Casting Calls' },
    { href: '/events', label: tr('nav.events', 'Events') },
    { href: '/stories', label: 'Spotlight' },
    { href: '/pricing', label: tr('nav.pricing', 'Pricing') },
  ];

  const adminLinks = [
    { href: '/admin', label: 'Pending' },
    { href: '/admin/featured', label: 'Featured' },
    { href: '/admin/members', label: 'Members' },
    { href: '/admin/casting-calls', label: 'Calls' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/stories', label: 'Stories' },
    { href: '/admin/craft', label: 'Craft' },
    { href: '/admin/newsletter', label: 'Newsletter' },
  ];

  const links = isAdmin ? adminLinks : publicLinks;

  const linkClass = isAdmin
    ? 'text-stone-300 hover:text-white text-sm whitespace-nowrap'
    : 'text-stone-700 hover:text-[#712B13] text-sm whitespace-nowrap';

  const logoHref = '/';

  return (
    <nav className={isAdmin ? 'border-b border-stone-700 bg-stone-900' : 'border-b border-stone-200 bg-white'}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
        <Link
          href={logoHref}
          className={`font-serif text-xl md:text-2xl font-medium shrink-0 ${isAdmin ? 'text-white' : 'text-stone-900'}`}
        >
          Magiora
          {isAdmin && (
            <span className="text-stone-400 italic text-xs md:text-sm ml-2 hidden sm:inline">editor&apos;s desk</span>
          )}
        </Link>

        <div className="hidden lg:flex items-center justify-center gap-4 flex-1 min-w-0 overflow-x-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </Link>
          ))}
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
                <Link
                  href="/dashboard"
                  className="k-button k-button-primary min-h-0 px-3 lg:px-4 py-1.5 lg:py-2 whitespace-nowrap"
                >
                  {tr('nav.dashboard', 'Dashboard')}
                </Link>
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
                className="text-[#712B13] hover:text-[#4A1B0C] text-sm font-medium whitespace-nowrap"
              >
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
        />
      </div>
    </nav>
  );
}
