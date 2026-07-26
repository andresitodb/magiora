'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterDirectoryOptions, type DirectoryFilterOption } from '@/lib/directoryFilterOptions';

export default function DirectoryCombobox({
  options, currentValue, onChange, placeholder, emptyLabel, ariaLabel,
}: {
  options: DirectoryFilterOption[];
  currentValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  ariaLabel: string;
}) {
  const selected = options.find((option) => option.value === currentValue);
  const [input, setInput] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const matches = useMemo(() => filterDirectoryOptions(options, input), [input, options]);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        setInput(options.find((option) => option.value === currentValue)?.label ?? '');
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [currentValue, options]);

  const select = (option?: DirectoryFilterOption) => {
    setInput(option?.label ?? '');
    onChange(option?.value ?? '');
    setOpen(false);
    setActiveIndex(-1);
  };

  return <div ref={wrapperRef} className="relative min-w-0" data-directory-combobox>
    <input
      ref={inputRef}
      role="combobox"
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
      value={input}
      placeholder={placeholder}
      className="k-control pr-9"
      onFocus={() => setOpen(true)}
      onChange={(event) => { setInput(event.target.value); setOpen(true); setActiveIndex(-1); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
        if (event.key === 'Enter' && open && activeIndex >= 0) { event.preventDefault(); select(matches[activeIndex]); }
        if (event.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
      }}
    />
    {(currentValue || input) && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { select(); inputRef.current?.focus(); }} aria-label={`Clear ${ariaLabel}`} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#712B13] focus-visible:outline focus-visible:outline-2">×</button>}
    {open && <div id={listboxId} role="listbox" className="k-card absolute left-0 top-full z-10 mt-1 max-h-64 w-full overflow-x-hidden overflow-y-auto shadow-lg">
      {matches.map((option, index) => <button
        id={`${listboxId}-${index}`}
        role="option"
        aria-selected={option.value === currentValue}
        key={option.value}
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => select(option)}
        className={`flex min-h-11 w-full items-center justify-between border-b border-stone-100 px-3 py-2 text-left text-sm font-serif hover:bg-[#FAECE7] focus-visible:outline focus-visible:outline-2 ${index === activeIndex ? 'bg-[#FAECE7]' : ''}`}
      ><span>{option.label}</span><span className="text-xs text-stone-400">{option.count}</span></button>)}
      {input.trim().length >= 2 && matches.length === 0 && <p role="status" className="px-3 py-3 text-sm italic text-stone-500">{emptyLabel}</p>}
    </div>}
  </div>;
}
