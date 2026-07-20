import { resetPassword } from './actions';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getLocale } from '@/lib/i18n';
import Link from 'next/link';

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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-medium">Magiora</Link>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white border border-stone-200 rounded-lg p-10 w-full max-w-md shadow-sm">
          <p className="font-serif italic text-sm text-[#993C1D] text-center mb-2">{t.kicker}</p>
          <h1 className="font-serif text-3xl font-medium text-center mb-2">{t.title}</h1>
          <p className="font-serif italic text-sm text-stone-500 text-center mb-8">{t.subtitle}</p>

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
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.confirm}</label>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#712B13] text-white py-2.5 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer"
            >
              {t.submit}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
