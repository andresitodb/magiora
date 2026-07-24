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
      className={`rounded-md border border-stone-200 bg-stone-50/70 p-4 sm:p-5 ${className}`}
      aria-label={`${title}${isMember ? ', included with Member' : ', available with Member'}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="k-eyebrow mb-1">MEMBER</p>
          <h4 className="font-serif text-lg font-medium">{title}</h4>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">{benefit}</p>
        </div>
        {isMember && (
          <span className="w-fit rounded-full border border-[#712B13]/15 bg-white px-2.5 py-1 text-xs font-medium text-[#712B13]">
            Included
          </span>
        )}
      </div>

      {children}

      {!isMember && (
        <Link
          href="/pricing"
          target="_blank"
          rel="noreferrer"
          className="k-button k-button-secondary mt-4 w-full sm:w-auto"
        >
          Unlock Member
        </Link>
      )}
    </section>
  );
}
