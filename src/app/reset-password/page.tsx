import { resetPassword } from './actions';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';
import MagioraLogo from '@/components/brand/MagioraLogo';

const LABELS = {
  en: {
    kicker: 'Almost there',
    title: 'Set new password',
    subtitle: 'Choose a new password for your account.',
    password: 'New password',
    confirm: 'Confirm password',
    submit: 'Update password',
  },
  es: {
    kicker: 'Casi listo',
    title: 'Nueva contraseña',
    subtitle: 'Elegí una nueva contraseña para tu cuenta.',
    password: 'Nueva contraseña',
    confirm: 'Confirmar contraseña',
    submit: 'Actualizar',
  },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = LABELS[locale === 'es' ? 'es' : 'en'];

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">
      <header>
        <div className="k-container py-4 flex items-center justify-between">
          <Link href="/" aria-label="Magiora home"><MagioraLogo /></Link>
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

          <form action={resetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t.password}</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="k-control"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.confirm}</label>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={6}
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
        </div>
      </main>
    </div>
  );
}
