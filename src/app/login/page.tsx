import { signIn } from './actions';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';
import MagioraLogo from '@/components/brand/MagioraLogo';

const LABELS = {
  en: {
    kicker: 'Welcome back',
    title: 'Sign in',
    subtitle: 'Continue to your account',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot?',
    submit: 'Sign in',
    no_account: "Don't have an account?",
    sign_up: 'Join',
  },
  es: {
    kicker: 'Bienvenido de nuevo',
    title: 'Iniciar sesión',
    subtitle: 'Continuá a tu cuenta',
    email: 'Correo',
    password: 'Contraseña',
    forgot: '¿Olvidaste?',
    submit: 'Entrar',
    no_account: '¿No tenés cuenta?',
    sign_up: 'Registrate',
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = LABELS[locale === 'es' ? 'es' : 'en'];

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">
      <header className="w-full">
        <div className="k-container py-4 flex items-center justify-between">
          <Link href="/" aria-label="Magiora home">
            <MagioraLogo />
          </Link>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="k-card p-6 md:p-10 w-full max-w-md">
          <p className="k-eyebrow text-center mb-2">{t.kicker}</p>
          <h1 className="k-section-title text-center mb-2">{t.title}</h1>
          <p className="k-body-muted text-center mb-8">{t.subtitle}</p>

          {params.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
              {decodeURIComponent(params.error)}
            </div>
          )}

          <form action={signIn} className="space-y-5">
            <input type="hidden" name="next" value={params.next ?? '/dashboard'} />
            <div>
              <label className="block text-sm font-medium mb-1">{t.email}</label>
              <input
                type="email"
                name="email"
                required
                autoCapitalize="none"
                autoComplete="email"
                className="k-control"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <label className="block text-sm font-medium">{t.password}</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#712B13] italic font-serif hover:underline"
                >
                  {t.forgot}
                </Link>
              </div>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="k-control"
              />
            </div>

            <button
              type="submit"
              className="k-button k-button-primary w-full"
            >
              {t.submit}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-8 font-serif">
            {t.no_account}{' '}
            <Link
              href={`/signup?next=${encodeURIComponent(params.next ?? '/dashboard')}`}
              className="text-[#712B13] italic hover:underline"
            >
              {t.sign_up}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
