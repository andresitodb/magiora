export default function MemberBenefitNotice({
  title,
  description,
  usage,
  compact = false,
}: {
  title: string;
  description?: string;
  usage?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      className={`rounded-md border border-[#D8C18A] bg-[#F7F0DE] text-stone-900 ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
      }`}
      aria-label={title}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#9A7628]" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#76591E]">{title}</p>
          {description && <p className="mt-1 text-sm leading-relaxed text-stone-700">{description}</p>}
          {usage && <p className="mt-1 text-xs font-medium text-stone-600">{usage}</p>}
        </div>
      </div>
    </div>
  );
}
