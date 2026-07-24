import Nav from '@/components/Nav';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasPaidMembership } from '@/lib/billingServer';
import { openBillingPortal, startCheckout } from './actions';
import MagioraLogo from '@/components/brand/MagioraLogo';

export const dynamic = 'force-dynamic';

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOnMember = user ? await hasPaidMembership(user.id) : false;

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />

      <main className="k-container k-section max-w-5xl">
        {params.error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 text-center">
            {params.error}
          </div>
        )}
        <div className="text-center mb-12 md:mb-16">
          <p className="k-eyebrow mb-2">Pricing</p>
          <h1 className="k-page-title mb-4">
            Two ways to be on Magiora
          </h1>
          <p className="k-body-muted text-base md:text-lg max-w-2xl mx-auto">
            Get listed for free. Unlock Member when you&apos;re ready to apply, get matched, and stand out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="k-card p-6 md:p-8 flex flex-col">
            <p className="font-serif italic text-xs text-stone-500 uppercase tracking-widest mb-2">Free</p>
            <h2 className="font-serif text-2xl font-medium mb-1">Listed</h2>
            <p className="font-serif italic text-sm text-stone-500 mb-6">For getting started.</p>
            <p className="font-serif text-4xl font-medium mb-1">$0</p>
            <p className="text-xs text-stone-500 italic font-serif mb-8">forever</p>

            <ul className="space-y-2 font-serif text-sm text-stone-700 flex-1">
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Basic profile in the directory</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Up to 5 skills</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Up to 3 gallery photos</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Demo reel link</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Browse all castings, events, and Spotlight interviews</li>
              <li className="flex gap-2 text-stone-400"><span>—</span> No applying to casting calls</li>
              <li className="flex gap-2 text-stone-400"><span>—</span> No profile customization</li>
            </ul>

            {!user ? (
              <Link href="/signup" className="k-button k-button-secondary mt-8 w-full">
                Start free
              </Link>
            ) : isOnMember ? (
              <p className="mt-8 text-center text-sm italic font-serif text-stone-400">You&apos;re on Member.</p>
            ) : (
              <p className="mt-8 text-center text-sm italic font-serif text-stone-500">You&apos;re on Listed.</p>
            )}
          </div>

          {/* MEMBER */}
          <div className="k-card bg-[#FAECE7] border-2 border-[#712B13] p-6 md:p-8 flex flex-col">
            <p className="font-serif italic text-xs text-[#712B13] uppercase tracking-widest mb-2">Paid</p>
            <h2 className="font-serif text-2xl font-medium mb-1">Member</h2>
            <p className="font-serif italic text-sm text-stone-600 mb-6">For working artists.</p>
            <p className="font-serif text-4xl font-medium mb-1">
              $9.99 <span className="text-base text-stone-500 italic font-normal">/ month</span>
            </p>
            <p className="text-xs text-stone-500 italic font-serif mb-8">or $79/year — save 35%</p>

            <ul className="space-y-2 font-serif text-sm text-stone-700 flex-1">
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Everything in Listed</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Apply to casting calls</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Get matched automatically</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Unlimited skills &amp; up to 10 gallery photos</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Custom profile URL (magiora.com/m/yourname)</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> 4 profile themes &amp; 6 color palettes</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Up to 4 additional video links with custom labels</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Priority support</li>
            </ul>

            {!user ? (
              <div className="mt-8 grid grid-cols-2 gap-2">
                <Link
                  href="/signup?plan=member&next=%2Fpricing%3Fplan%3Dmonthly"
                  className="k-button k-button-primary w-full"
                >
                  Monthly
                </Link>
                <Link
                  href="/signup?plan=member&next=%2Fpricing%3Fplan%3Dannual"
                  className="k-button bg-stone-800 text-white hover:bg-stone-900 w-full"
                >
                  Annual
                </Link>
              </div>
            ) : isOnMember ? (
              <form action={openBillingPortal} className="mt-8">
                <button type="submit" className="k-button k-button-primary w-full">
                  Manage billing
                </button>
              </form>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-2">
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value="monthly" />
                  <button
                    type="submit"
                    className="k-button k-button-primary w-full"
                  >
                    Monthly
                  </button>
                </form>
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value="annual" />
                  <button
                    type="submit"
                    className="k-button bg-stone-800 text-white hover:bg-stone-900 w-full"
                  >
                    Annual
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-center mt-12 text-sm italic font-serif text-stone-500 max-w-xl mx-auto">
          Cancel anytime. No commitment. Built by indie filmmakers for indie filmmakers.
        </p>
      </main>

      <footer className="border-t border-stone-200 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <Link href="/" aria-label="Magiora home" className="inline-flex hover:opacity-80">
            <MagioraLogo />
          </Link>
        </div>
      </footer>
    </div>
  );
}
