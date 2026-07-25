'use client';

import { useState, useTransition, useEffect } from 'react';
import { checkSlugAvailability } from '@/app/dashboard/profile/actions';
import { getProfileDomainPreview } from '@/lib/brandDomain';
import MemberBenefitNotice from '@/components/MemberBenefitNotice';

export default function SlugEditor({
  currentSlug,
  isMember,
}: {
  currentSlug: string;
  isMember: boolean;
}) {
  const [slug, setSlug] = useState(currentSlug);
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'
  >('unchanged');
  const [, startTransition] = useTransition();
  const domainPreview = getProfileDomainPreview(
    slug,
    process.env.NEXT_PUBLIC_BRAND_DOMAIN,
  );

  useEffect(() => {
    if (!isMember) return;
    const timer = setTimeout(() => {
      if (slug === currentSlug) {
        setStatus('unchanged');
        return;
      }
      if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
        setStatus('invalid');
        return;
      }
      setStatus('checking');
      startTransition(async () => {
        const res = await checkSlugAvailability(slug);
        setStatus(res.available ? 'available' : 'taken');
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [slug, currentSlug, isMember]);

  return (
    <div>
      {isMember && (
        <div className="mb-4">
          <MemberBenefitNotice
            title="Included with Member"
            description="Custom profile URL included with Member."
            usage={currentSlug ? `Current URL: /m/${currentSlug}` : 'Choose your custom profile URL below.'}
            compact
          />
        </div>
      )}
      <label className="block text-sm font-medium mb-1">
        Your link
        {!isMember && (
          <span className="text-xs text-stone-500 ml-2 italic font-serif font-normal">
            Preview
          </span>
        )}
      </label>

      <input
        type="text"
        name="slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        className="k-control"
        minLength={3}
        maxLength={30}
        aria-describedby="member-url-preview member-url-note"
      />

      <p
        id="member-url-preview"
        className="mt-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-serif text-sm text-stone-800"
        aria-live="polite"
      >
        {domainPreview}
      </p>
      <p id="member-url-note" className="mt-2 text-xs leading-relaxed text-stone-600">
        Your Member profile can use a personal Magiora address once custom domains are activated.
        The current public profile continues to use its Magiora profile link.
      </p>

      <div className="mt-1 min-h-[16px] font-serif text-xs italic">
        {!isMember ? (
          <span className="text-stone-500">
            Try your preferred address. It will be available again with Member.
          </span>
        ) : (
          <>
          {status === 'unchanged' && <span className="text-stone-500">Current link.</span>}
          {status === 'checking' && <span className="text-stone-500">Checking availability…</span>}
          {status === 'available' && <span className="text-green-700">✓ Available</span>}
          {status === 'taken' && <span className="text-red-700">Already taken</span>}
          {status === 'invalid' && (
            <span className="text-amber-700">
              3–30 chars, lowercase letters, numbers, hyphens. Must start &amp; end with a letter or number.
            </span>
          )}
          </>
        )}
      </div>
    </div>
  );
}
