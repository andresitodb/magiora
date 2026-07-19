import Link from 'next/link';

export default function BackLink({
  href,
  label,
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-[#712B13] font-serif italic hover:underline mb-4"
    >
      <span aria-hidden>←</span>
      <span>{label ?? 'Back'}</span>
    </Link>
  );
}
