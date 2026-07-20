import { requestPasswordReset } from './actions';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';

const LABELS = {
  en: {
    kicker: 'Recover access',
    title: 'Forgot password',
    subtitle: "Enter your email and we'll send a reset link.",
    email: 'Email',
    submit: 'Send reset link',
    back: '← Back to sign in',
    sent: 'If an account exists for that email, a reset link has been sent.',
  },
  es: {
    kicker: 'Recuperar acceso',
    title: 'Olvidé mi contraseña',
    subtitle: 'Poné tu correo y te enviamos un link para resetear.',
    email: 'Correo',
    submit: 'Enviar link',
    back: '← Volver al login',
    sent: 'Si existe una cuenta con ese correo, te enviamos el link.',
  },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
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

          {params.sent && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md p-3 mb-6 font-serif">
              {t.sent}
            </div>
          )}
          {params.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
              {decodeURIComponent(params.error)}
            </div>
          )}

          <form action={requestPasswordReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t.email}</label>
              <input
                type="email"
                name="email"
                required
                autoCapitalize="none"
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
            <Link href="/login" className="text-[#712B13] italic hover:underline">
              {t.back}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
