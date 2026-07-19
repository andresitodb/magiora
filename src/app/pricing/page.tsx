import Nav from '@/components/Nav';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { startCheckout } from './actions';

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

  let currentPlan: string | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    currentPlan = data?.plan ?? null;
  }

  const isOnMember = currentPlan === 'member';

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav />

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {params.error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 text-center">
            {params.error}
          </div>
        )}
        <div className="text-center mb-12 md:mb-16">
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Pricing</p>
          <h1 className="font-serif text-4xl md:text-6xl font-medium mb-4 tracking-tight">
            Two ways to be on Kinora
          </h1>
          <p className="font-serif italic text-base md:text-lg text-stone-600 max-w-2xl mx-auto">
            Get listed for free. Upgrade when you&apos;re ready to apply, get matched, and stand out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="bg-white border border-stone-200 rounded-md p-6 md:p-8 flex flex-col">
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
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Browse all casting calls, events, and stories</li>
              <li className="flex gap-2 text-stone-400"><span>—</span> No applying to casting calls</li>
              <li className="flex gap-2 text-stone-400"><span>—</span> No profile customization</li>
            </ul>

            {!user ? (
              <Link href="/signup" className="block text-center mt-8 py-2.5 border border-stone-300 rounded-md font-medium hover:bg-stone-50">
                Start free
              </Link>
            ) : isOnMember ? (
              <p className="mt-8 text-center text-sm italic font-serif text-stone-400">You&apos;re on Member.</p>
            ) : (
              <p className="mt-8 text-center text-sm italic font-serif text-stone-500">You&apos;re on Listed.</p>
            )}
          </div>

          {/* MEMBER */}
          <div className="bg-[#FAECE7] border-2 border-[#712B13] rounded-md p-6 md:p-8 flex flex-col relative">
            <span className="absolute -top-3 right-6 bg-[#712B13] text-white text-xs px-3 py-1 rounded-full font-medium">
              Recommended
            </span>
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
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Unlimited skills &amp; gallery</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Custom profile URL (yourname.kinora.com)</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Profile templates &amp; colors</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Multiple video links with custom labels</li>
              <li className="flex gap-2"><span className="text-[#712B13]">✓</span> Priority support</li>
            </ul>

            {!user ? (
              <div className="mt-8 grid grid-cols-2 gap-2">
                <Link
                  href="/signup?plan=member&next=%2Fpricing%3Fplan%3Dmonthly"
                  className="block text-center bg-[#712B13] text-white py-2.5 rounded-md font-medium hover:bg-[#4A1B0C]"
                >
                  Monthly
                </Link>
                <Link
                  href="/signup?plan=member&next=%2Fpricing%3Fplan%3Dannual"
                  className="block text-center bg-stone-800 text-white py-2.5 rounded-md font-medium hover:bg-stone-900"
                >
                  Annual
                </Link>
              </div>
            ) : isOnMember ? (
              <p className="mt-8 text-center text-sm italic font-serif text-[#712B13]">You&apos;re a Member.</p>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-2">
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value="monthly" />
                  <button
                    type="submit"
                    className="w-full bg-[#712B13] text-white py-2.5 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer"
                  >
                    Monthly
                  </button>
                </form>
                <form action={startCheckout}>
                  <input type="hidden" name="plan" value="annual" />
                  <button
                    type="submit"
                    className="w-full bg-stone-800 text-white py-2.5 rounded-md font-medium hover:bg-stone-900 cursor-pointer"
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
          <Link href="/" className="font-serif text-sm italic text-stone-500 hover:opacity-80">
            Kinora
          </Link>
        </div>
      </footer>
    </div>
  );
}
