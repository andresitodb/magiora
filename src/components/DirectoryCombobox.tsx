'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { filterDirectoryOptions, type DirectoryFilterOption } from '@/lib/directoryFilterOptions';

export default function DirectoryCombobox({
  options,
  currentValue,
  onChange,
  placeholder,
  emptyLabel,
  ariaLabel,
  clearLabel,
  isOpen,
  onOpenChange,
}: {
  options: DirectoryFilterOption[];
  currentValue: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyLabel: string;
  ariaLabel: string;
  clearLabel: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selectedOption = options.find((option) => option.value === currentValue);
  const [typedSearch, setTypedSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filteredOptions = useMemo(
    () => filterDirectoryOptions(options, typedSearch),
    [options, typedSearch],
  );

  const select = (option?: DirectoryFilterOption) => {
    const value = option?.value ?? '';
    setTypedSearch('');
    onOpenChange(false);
    setHighlightedIndex(-1);
    onChange(value);
  };

  return <div
    ref={wrapperRef}
    className="relative min-w-0"
    data-directory-combobox
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        onOpenChange(false);
        setHighlightedIndex(-1);
        setTypedSearch('');
      }
    }}
  >
    <input
      ref={inputRef}
      role="combobox"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-controls={listboxId}
      aria-autocomplete="list"
      aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
      value={isOpen ? typedSearch : selectedOption?.label ?? ''}
      placeholder={placeholder}
      className="k-control pr-9"
      onFocus={() => {
        setTypedSearch('');
        onOpenChange(true);
        setHighlightedIndex(-1);
      }}
      onChange={(event) => {
        setTypedSearch(event.target.value);
        onOpenChange(true);
        setHighlightedIndex(-1);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          onOpenChange(true);
          setHighlightedIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setHighlightedIndex((index) => Math.max(index - 1, 0));
        }
        if (event.key === 'Enter' && isOpen && highlightedIndex >= 0) {
          event.preventDefault();
          select(filteredOptions[highlightedIndex]);
        }
        if (event.key === 'Escape') {
          onOpenChange(false);
          setHighlightedIndex(-1);
          setTypedSearch('');
        }
      }}
    />
    {(currentValue || typedSearch) && <button
      type="button"
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        select();
        inputRef.current?.focus();
      }}
      aria-label={clearLabel}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-[#712B13] focus-visible:outline focus-visible:outline-2"
    >×</button>}
    {isOpen && <div
      id={listboxId}
      role="listbox"
      className="mt-1 max-h-64 w-full overflow-x-hidden overflow-y-auto rounded-[var(--magiora-radius)] border border-[var(--magiora-border)] bg-[var(--magiora-surface)] shadow-sm"
    >
      {filteredOptions.map((option, index) => <button
        id={`${listboxId}-${index}`}
        role="option"
        aria-selected={option.value === currentValue}
        key={option.value}
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          select(option);
        }}
        onClick={(event) => {
          if (event.detail === 0) select(option);
        }}
        className={`flex min-h-11 w-full items-center justify-between border-b border-stone-100 px-3 py-2 text-left text-sm font-serif hover:bg-[#FAECE7] focus-visible:outline focus-visible:outline-2 ${index === highlightedIndex ? 'bg-[#FAECE7]' : ''}`}
      ><span>{option.label}</span><span className="text-xs text-stone-400">{option.count}</span></button>)}
      {typedSearch.trim().length >= 2 && filteredOptions.length === 0 && <p role="status" className="px-3 py-3 text-sm italic text-stone-500">{emptyLabel}</p>}
    </div>}
  </div>;
}
