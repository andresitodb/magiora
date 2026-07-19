'use client';

import { useState } from 'react';
import { CREDIT_GROUPS, groupCredits } from '@/lib/projects';

interface Credit {
  id: string;
  role_title: string;
  role_category: string | null;
  character_name: string | null;
  external_name: string | null;
  position: number;
  profile?: {
    id: string;
    slug: string;
    display_name: string;
    headshot_url: string | null;
  } | null;
}

export default function CreditsReorderManager({
  projectId,
  initialCredits,
  onReorder,
  onRemove,
}: {
  projectId: string;
  initialCredits: Credit[];
  onReorder: (formData: FormData) => void;
  onRemove: (formData: FormData) => void;
}) {
  const [credits, setCredits] = useState<Credit[]>(
    [...initialCredits].sort((a, b) => a.position - b.position)
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const groupedCredits = groupCredits(credits);

  function moveCredit(id: string, direction: -1 | 1) {
    const index = credits.findIndex((c) => c.id === id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= credits.length) return;
    const next = [...credits];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setCredits(next);
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    const fromIndex = credits.findIndex((c) => c.id === draggingId);
    const toIndex = credits.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...credits];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCredits(next);
    setDraggingId(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  async function saveOrder() {
    const orderedIds = credits.map((c) => c.id);
    // Check if changed from initial
    const originalIds = [...initialCredits]
      .sort((a, b) => a.position - b.position)
      .map((c) => c.id);
    const isUnchanged =
      orderedIds.length === originalIds.length &&
      orderedIds.every((id, i) => id === originalIds[i]);

    if (isUnchanged) return;

    setPending(true);
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('ordered_ids', JSON.stringify(orderedIds));
    await onReorder(formData);
    setPending(false);
  }

  const hasChanges = (() => {
    const originalIds = [...initialCredits]
      .sort((a, b) => a.position - b.position)
      .map((c) => c.id);
    const currentIds = credits.map((c) => c.id);
    if (currentIds.length !== originalIds.length) return false;
    return currentIds.some((id, i) => id !== originalIds[i]);
  })();

  return (
    <>
      <div className="space-y-6">
        {CREDIT_GROUPS.map((group) => {
          const items = groupedCredits[group.id];
          if (!items || items.length === 0) return null;
          return (
            <div key={group.id}>
              <p className="font-serif italic text-xs text-stone-500 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <ul className="space-y-2">
                {items.map((c: Credit) => (
                  <CreditRow
                    key={c.id}
                    credit={c}
                    projectId={projectId}
                    isFirst={credits[0]?.id === c.id}
                    isLast={credits[credits.length - 1]?.id === c.id}
                    isDragging={draggingId === c.id}
                    onDragStart={() => handleDragStart(c.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, c.id)}
                    onDragEnd={handleDragEnd}
                    onMoveUp={() => moveCredit(c.id, -1)}
                    onMoveDown={() => moveCredit(c.id, 1)}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            </div>
          );
        })}
        {groupedCredits['other'] && groupedCredits['other'].length > 0 && (
          <div>
            <p className="font-serif italic text-xs text-stone-500 uppercase tracking-wider mb-2">
              Other
            </p>
            <ul className="space-y-2">
              {groupedCredits['other'].map((c: Credit) => (
                <CreditRow
                  key={c.id}
                  credit={c}
                  projectId={projectId}
                  isFirst={credits[0]?.id === c.id}
                  isLast={credits[credits.length - 1]?.id === c.id}
                  isDragging={draggingId === c.id}
                  onDragStart={() => handleDragStart(c.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, c.id)}
                  onDragEnd={handleDragEnd}
                  onMoveUp={() => moveCredit(c.id, -1)}
                  onMoveDown={() => moveCredit(c.id, 1)}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="mt-4 flex items-center justify-between bg-[#FAEEDA] border border-[#FAC775] rounded-md p-3">
          <p className="text-xs italic font-serif text-stone-700">
            You changed the order. Don&apos;t forget to save.
          </p>
          <button
            type="button"
            onClick={saveOrder}
            disabled={pending}
            className="bg-[#712B13] text-white text-xs py-1.5 px-4 rounded hover:bg-[#4A1B0C] disabled:opacity-50 cursor-pointer font-medium whitespace-nowrap"
          >
            {pending ? 'Saving…' : 'Save order'}
          </button>
        </div>
      )}
    </>
  );
}

function CreditRow({
  credit,
  projectId,
  isFirst,
  isLast,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  credit: Credit;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: (formData: FormData) => void;
}) {
  const linked = credit.profile;
  const displayName = linked?.display_name ?? credit.external_name;

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 bg-white border border-stone-200 rounded-md transition-opacity ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Drag handle */}
      <span
        className="text-stone-400 hover:text-[#712B13] cursor-grab active:cursor-grabbing select-none flex-shrink-0 text-base"
        title="Drag to reorder"
      >
        ⋮⋮
      </span>

      {linked?.headshot_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={linked.headshot_url}
          alt={displayName ?? ''}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#FAECE7] flex items-center justify-center text-[#712B13] text-xs font-medium flex-shrink-0">
          {(displayName?.[0] ?? '?').toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-serif font-medium text-sm">
          {linked ? (
            <a
              href={`/m/${linked.slug}`}
              target="_blank"
              className="hover:text-[#712B13] hover:underline"
              rel="noopener"
            >
              {displayName} ↗
            </a>
          ) : (
            <span>{displayName}</span>
          )}
        </p>
        <p className="text-xs text-stone-500 italic font-serif">
          {credit.role_title}
          {credit.character_name && (
            <span className="text-stone-400"> as &ldquo;{credit.character_name}&rdquo;</span>
          )}
        </p>
      </div>

      {/* Up/down arrows for mobile + accessibility */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-stone-400 hover:text-[#712B13] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs leading-none p-0.5"
          aria-label="Move up"
          title="Move up"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-stone-400 hover:text-[#712B13] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-xs leading-none p-0.5"
          aria-label="Move down"
          title="Move down"
        >
          ▼
        </button>
      </div>

      <form action={onRemove}>
        <input type="hidden" name="credit_id" value={credit.id} />
        <input type="hidden" name="project_id" value={projectId} />
        <button
          type="submit"
          className="text-stone-400 hover:text-red-700 cursor-pointer text-sm italic font-serif"
        >
          remove
        </button>
      </form>
    </li>
  );
}
