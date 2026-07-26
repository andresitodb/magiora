import Link from 'next/link';

export default function MemberPublishingNotice({ noun }: { noun: string }) {
  return <div className="mb-6 rounded-md border border-[#D8C39A] bg-[#FBF7EE] px-4 py-4 text-stone-800">
    <p className="font-serif font-medium">Publishing {noun} is included with Member.</p>
    <p className="mt-1 text-sm text-stone-600">Your existing work stays preserved and available here.</p>
    <Link href="/pricing" className="mt-3 inline-flex text-sm font-medium text-[#712B13] underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Explore Member →</Link>
  </div>;
}
