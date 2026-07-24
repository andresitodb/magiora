import Link from 'next/link';

const castingSections = [
  {
    title: 'My Applications',
    description: 'Track submitted, viewed, shortlisted, and cast responses.',
    href: '/dashboard/applications',
    action: 'Track applications',
  },
  {
    title: 'Browse Casting Calls',
    description: 'Explore the global catalogue of open roles without leaving your workspace.',
    href: '/dashboard/casting/browse',
    action: 'Browse open calls',
  },
];

export default function CastingWorkspacePage() {
  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="k-eyebrow mb-2">CASTING</p>
        <h1 className="k-section-title">Your casting workspace</h1>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-stone-500">
          Discover roles and follow every application from one place.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {castingSections.map((section) => (
          <article key={section.title} className="k-card flex min-h-44 flex-col p-5">
            <h2 className="font-serif text-xl font-medium">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{section.description}</p>
            <Link href={section.href} className="k-link mt-auto pt-6 text-sm font-medium">
              {section.action} <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
        <article className="rounded-md border border-dashed border-stone-300 p-5 text-stone-500 md:col-span-2">
          <p className="k-eyebrow mb-2 text-stone-400">Coming later</p>
          <h2 className="font-serif text-xl font-medium">Saved Casting Calls</h2>
          <p className="mt-2 text-sm">A place for opportunities you want to revisit.</p>
        </article>
      </div>
    </div>
  );
}
