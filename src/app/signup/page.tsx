import { signUp } from '../login/actions';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';

const LABELS = {
  en: {
    kicker: 'Join the community',
    title: 'Create your account',
    subtitle: 'Free to list. Members unlock the full directory.',
    name: 'Your name',
    email: 'Email',
    password: 'Password',
    submit: 'Create account',
    have_account: 'Already have an account?',
    sign_in: 'Sign in',
    terms:
      'By creating an account you agree to our terms and acknowledge our privacy practices.',
  },
  es: {
    kicker: 'Sumate a la comunidad',
    title: 'Creá tu cuenta',
    subtitle: 'Listado gratis. Los miembros desbloquean todo.',
    name: 'Tu nombre',
    email: 'Correo',
    password: 'Contraseña',
    submit: 'Crear cuenta',
    have_account: '¿Ya tenés cuenta?',
    sign_in: 'Entrar',
    terms:
      'Al crear una cuenta aceptás nuestros términos y reconocés nuestras prácticas de privacidad.',
  },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string; next?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = LABELS[locale === 'es' ? 'es' : 'en'];

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">
      <header>
        <div className="k-container py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-medium">Magiora</Link>
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

          <form action={signUp} className="space-y-5">
            <input
              type="hidden"
              name="plan"
              value={params.plan === 'member' ? 'member' : 'listed'}
            />
            <input
              type="hidden"
              name="next"
              value={
                params.next ??
                (params.plan === 'member' ? '/pricing?plan=monthly' : '/dashboard')
              }
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t.name}</label>
              <input
                type="text"
                name="display_name"
                required
                className="k-control"
              />
            </div>

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
              <label className="block text-sm font-medium mb-1">{t.password}</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
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

          <p className="text-xs text-stone-400 italic font-serif mt-4 text-center">{t.terms}</p>

          <p className="text-center text-sm text-stone-500 mt-8 font-serif">
            {t.have_account}{' '}
            <Link
              href={`/login?next=${encodeURIComponent(
                params.next ??
                  (params.plan === 'member' ? '/pricing?plan=monthly' : '/dashboard')
              )}`}
              className="text-[#712B13] italic hover:underline"
            >
              {t.sign_in}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
