import Link from 'next/link';

export default function MemberEdition({
  title,
  benefit,
  isMember,
  children,
  className = '',
}: {
  title: string;
  benefit: string;
  isMember: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-md border border-stone-300 bg-white shadow-[0_12px_32px_-28px_rgba(28,25,23,0.55)] ${className}`}
      aria-label={`${title}${isMember ? ', included with Member' : ', available with Member'}`}
    >
      <div className="border-b border-stone-200 bg-stone-950 px-4 py-4 text-stone-50 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">Member edition</p>
            <h4 className="font-serif text-xl font-medium tracking-[-0.01em]">{title}</h4>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-stone-300">{benefit}</p>
          </div>
          {isMember && (
            <span className="w-fit rounded-full border border-stone-600 px-2.5 py-1 text-[11px] font-medium text-stone-200">
              Included
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {children}
        {!isMember && (
          <Link
            href="/pricing"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex min-h-11 items-center border-b border-[#712B13] text-sm font-medium text-[#712B13] transition-colors hover:border-stone-900 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#712B13]"
          >
            Unlock Member <span className="ml-1.5" aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </section>
  );
}
