'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CompleteProfileSite } from '@/components/ThemeSelector';
import { saveTemplateSettings } from '@/app/dashboard/profile/actions';
import type { ProfilePreviewData } from '@/lib/profilePreview';
import {
  getAccent,
  getSupportedAccents,
  getTemplate,
  type AccentId,
  type TemplateId,
} from '@/lib/profile_themes';
import {
  PROFILE_TEMPLATE_PREVIEW_STORAGE_KEY,
  type ProfileTemplatePreviewPayload,
} from '@/lib/profileTemplatePreview';
import {
  resolveProfileTemplateSettings,
  TYPOGRAPHY_SYSTEMS,
  type ScreenPresenceSectionId,
  type StoredProfileTemplateSettings,
} from '@/lib/profileTemplateSettings';
import {
  type CinematicHomeSectionId,
  type CinematicPageId,
} from '@/lib/profileTemplateRegistry';

const SECTION_NAMES: Record<ScreenPresenceSectionId, string> = {
  about: 'About',
  gallery: 'Gallery',
  reel: 'Reel',
  work: 'Work',
  credits: 'Credits',
  practice: 'Practice',
  recommendations: 'Recommendations',
  contact: 'Contact',
};

type Panel = 'colors' | 'typography' | 'reading' | 'sections' | 'navigation' | 'home';

export default function ProfileTemplatePreviewPage({
  initialTemplate,
  initialAccent,
  initialData,
  initialSettings = null,
  isMember,
}: {
  initialTemplate: TemplateId;
  initialAccent: AccentId;
  initialData: ProfilePreviewData;
  initialSettings?: StoredProfileTemplateSettings;
  isMember: boolean;
}) {
  const initialResolved = useMemo(() => resolveProfileTemplateSettings({
    saved: initialSettings,
    legacyTemplate: initialTemplate,
    legacyAccent: initialAccent,
  }), [initialAccent, initialSettings, initialTemplate]);
  const [previewData, setPreviewData] = useState(initialData);
  const [savedSettings, setSavedSettings] = useState(initialResolved);
  const [draft, setDraft] = useState(initialResolved);
  const [panel, setPanel] = useState<Panel>('colors');
  const [controlsOpen, setControlsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [cinematicPage, setCinematicPage] = useState<CinematicPageId>('home');
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedSettings);
  const isScreenPresence = draft.templateId === 'editorial';
  const isCinematic = draft.templateId === 'cinematic';
  const isCustomizable = isScreenPresence || isCinematic;

  useEffect(() => {
    const stored = window.localStorage.getItem(PROFILE_TEMPLATE_PREVIEW_STORAGE_KEY);
    if (!stored) return;
    window.localStorage.removeItem(PROFILE_TEMPLATE_PREVIEW_STORAGE_KEY);
    try {
      const payload = JSON.parse(stored) as Partial<ProfileTemplatePreviewPayload>;
      if (!payload.data || !payload.template || !payload.accent) return;
      const local = resolveProfileTemplateSettings({
        local: {
          templateId: getTemplate(payload.template).id,
          paletteId: getAccent(payload.accent).id,
        },
        saved: initialSettings,
        legacyTemplate: initialTemplate,
        legacyAccent: initialAccent,
      });
      const timer = window.setTimeout(() => {
        setPreviewData({ ...initialData, ...payload.data });
        setDraft(local);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      // Authenticated server data and saved settings remain the safe fallback.
    }
  }, [initialAccent, initialData, initialSettings, initialTemplate]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function reorderSections(event: DragEndEvent, kind: 'screen' | 'navigation' | 'home' = 'screen') {
    if (!event.over || event.active.id === event.over.id) return;
    setDraft((current) => {
      const key = kind === 'screen' ? 'sectionOrder' : kind === 'navigation' ? 'navigationOrder' : 'homeSectionOrder';
      const order = current[key] as string[];
      const from = order.indexOf(String(event.active.id));
      const to = order.indexOf(String(event.over!.id));
      return { ...current, [key]: arrayMove(order, from, to) };
    });
  }

  function save() {
    setMessage('');
    if (!isMember) {
      setMessage('Template customization is available with Member.');
      return;
    }
    startTransition(async () => {
      const result = await saveTemplateSettings({
        templateId: draft.templateId,
        paletteId: draft.paletteId,
        fontStyle: draft.fontStyle,
        sectionOrder: draft.sectionOrder,
        hiddenSections: draft.hiddenSections,
        navigationOrder: draft.navigationOrder,
        homeSectionOrder: draft.homeSectionOrder,
        readingScale: draft.readingScale,
      });
      setMessage(result.message);
      if (result.ok) setSavedSettings(draft);
    });
  }

  function cancel() {
    setDraft(savedSettings);
    setMessage('Unsaved changes discarded.');
  }

  return (
    <div className={isCustomizable ? 'pb-28 sm:pb-0' : undefined}>
      <CompleteProfileSite
        template={draft.templateId}
        accent={getAccent(draft.paletteId)}
        data={previewData}
        settings={draft}
        {...(isCinematic ? { cinematicPage, onCinematicNavigate: setCinematicPage } : {})}
      />

      {isCustomizable && (
        <aside
          aria-label={`${getTemplate(draft.templateId).name} customization controls`}
          className={`fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 rounded-md border border-stone-300 bg-stone-50 p-2.5 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.7)] sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 ${
            controlsOpen ? 'w-[calc(100%-1.5rem)] max-w-xl' : 'w-auto'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setControlsOpen((current) => !current)}
                aria-expanded={controlsOpen}
                aria-label={controlsOpen ? 'Minimize template customization controls' : 'Open template customization controls'}
                className="rounded-sm border border-stone-300 px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {controlsOpen ? 'Minimize' : 'Customize'}
              </button>
              {controlsOpen && dirty && <span className="text-xs font-medium text-[#76591E]">Unsaved changes</span>}
            </div>
            {controlsOpen && <div className="flex items-center gap-2">
              <Link
                href="/dashboard/profile"
                onClick={(event) => {
                  if (dirty && !window.confirm('Discard unsaved template changes?')) event.preventDefault();
                }}
                className="text-sm underline decoration-current/40 underline-offset-4 focus-visible:outline focus-visible:outline-2"
              >
                Exit
              </Link>
              <button type="button" onClick={cancel} disabled={!dirty || isPending} className="k-button k-button-secondary disabled:cursor-not-allowed disabled:opacity-45">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={!dirty || isPending} className="k-button k-button-primary disabled:cursor-not-allowed disabled:opacity-45">
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>}
          </div>

          {controlsOpen && (
            <div className="mt-2 border-t border-stone-200 pt-2">
              <div role="tablist" aria-label="Template customization" className={`grid gap-1 ${isCinematic ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-3'}`}>
                {(isCinematic ? ['colors', 'typography', 'reading', 'navigation', 'home'] : ['colors', 'typography', 'sections'] as Panel[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={panel === item}
                    onClick={() => setPanel(item as Panel)}
                    className={`rounded-sm px-2 py-2 text-xs font-medium capitalize focus-visible:outline focus-visible:outline-2 ${
                      panel === item ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="mt-2 max-h-56 overflow-y-auto pr-1">
                {panel === 'colors' && (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {getSupportedAccents(draft.templateId).map((palette) => (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, paletteId: palette.id }))}
                        aria-pressed={draft.paletteId === palette.id}
                        aria-label={`Use ${palette.name} palette`}
                        className={`rounded-sm border p-1.5 text-left focus-visible:outline focus-visible:outline-2 ${
                          draft.paletteId === palette.id ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200'
                        }`}
                        style={{ backgroundColor: palette.background, color: palette.primaryText }}
                      >
                        <span className="flex gap-0.5" aria-hidden="true">
                          {[palette.accent, palette.accentSoft, palette.surface].map((color) => (
                            <span key={color} className="h-2.5 flex-1 border border-black/10" style={{ backgroundColor: color }} />
                          ))}
                        </span>
                        <span className="mt-1 block text-xs">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {panel === 'typography' && (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {TYPOGRAPHY_SYSTEMS.filter((system) => isCinematic
                      ? ['auteur', 'premiere', 'modern-cinema', 'festival'].includes(system.id)
                      : ['editorial', 'modern', 'classic', 'contemporary'].includes(system.id)
                    ).map((system) => (
                      <button
                        key={system.id}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, fontStyle: system.id }))}
                        aria-pressed={draft.fontStyle === system.id}
                        className={`rounded-sm border p-2 text-left focus-visible:outline focus-visible:outline-2 ${
                          draft.fontStyle === system.id ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200'
                        }`}
                      >
                        <span className={`block text-lg ${system.displayClass} ${system.displayWeightClass}`}>Cinema</span>
                        <span className={`block text-[11px] text-stone-600 ${system.metadataClass}`}>{system.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {panel === 'reading' && isCinematic && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, readingScale: scale }))}
                        aria-pressed={draft.readingScale === scale}
                        className={`rounded-sm border p-2 text-left capitalize focus-visible:outline focus-visible:outline-2 ${
                          draft.readingScale === scale ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200'
                        }`}
                      >
                        <span className={scale === 'small' ? 'text-xs' : scale === 'large' ? 'text-base' : 'text-sm'}>{scale}</span>
                      </button>
                    ))}
                  </div>
                )}

                {panel === 'sections' && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderSections}>
                    <SortableContext items={draft.sectionOrder} strategy={verticalListSortingStrategy}>
                      <ol className="space-y-1" aria-label="Profile section order">
                        {draft.sectionOrder.map((section) => (
                          <SortableSection key={section} id={section} label={SECTION_NAMES[section]} />
                        ))}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
                {panel === 'navigation' && isCinematic && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => reorderSections(event, 'navigation')}>
                    <SortableContext items={draft.navigationOrder} strategy={verticalListSortingStrategy}>
                      <ol className="space-y-1" aria-label="Cinematic navigation order">
                        {draft.navigationOrder.map((item) => <SortableItem key={item} id={item} label={item === 'home' ? 'Home' : item[0].toUpperCase() + item.slice(1)} />)}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
                {panel === 'home' && isCinematic && (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => reorderSections(event, 'home')}>
                    <SortableContext items={draft.homeSectionOrder} strategy={verticalListSortingStrategy}>
                      <ol className="space-y-1" aria-label="Cinematic home section order">
                        {draft.homeSectionOrder.map((item) => <SortableItem key={item} id={item} label={item.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')} />)}
                      </ol>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}
          {controlsOpen && <p aria-live="polite" className="mt-2 min-h-4 text-xs text-stone-600">{message}</p>}
        </aside>
      )}
    </div>
  );
}

function SortableSection({ id, label }: { id: ScreenPresenceSectionId; label: string }) {
  return <SortableItem id={id} label={label} />;
}

function SortableItem({ id, label }: { id: ScreenPresenceSectionId | CinematicPageId | CinematicHomeSectionId; label: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex select-none items-center gap-2 rounded-sm border bg-white px-2 py-1.5 motion-reduce:transition-none ${
        isDragging ? 'border-[#9A7628] shadow-md' : 'border-stone-200'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move ${label} section`}
        className="cursor-grab touch-none rounded-sm px-2 py-1 text-stone-500 active:cursor-grabbing focus-visible:outline focus-visible:outline-2"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
      <span className="text-sm">{label}</span>
    </li>
  );
}
