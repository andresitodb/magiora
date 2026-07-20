'use client';

import { useState, useRef, useEffect, useSyncExternalStore } from 'react';

const subscribeToOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => '';

export default function SubscribeCalendarButton() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getOrigin,
    getServerOrigin
  );
  const host = origin ? new URL(origin).host : '';
  const urls = origin
    ? {
        webcal: `webcal://${host}/events.ics`,
        gcal: `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(`${origin}/events.ics`)}`,
      }
    : null;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-white border border-stone-300 text-stone-800 py-2 px-4 rounded-md font-medium text-sm hover:bg-stone-50 cursor-pointer flex items-center gap-2"
      >
        <span>📆</span> Subscribe to calendar
      </button>

      {open && (
        <div className="absolute z-10 right-0 mt-1 w-72 border border-stone-200 rounded-md bg-white shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="font-serif italic text-xs text-[#993C1D]">
              Stay in sync — auto-updates as we publish new events.
            </p>
          </div>
          <a
            href={urls?.webcal ?? '/events.ics'}
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif"
            onClick={() => setOpen(false)}
          >
            Apple Calendar / iCal <span className="text-stone-400 italic text-xs">(auto-sync)</span>
          </a>
          <a
            href={urls?.gcal ?? '#'}
            target="_blank"
            rel="noopener"
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100"
            onClick={() => setOpen(false)}
          >
            Google Calendar <span className="text-stone-400 italic text-xs">(auto-sync)</span>
          </a>
          <a
            href="/events.ics"
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100 text-stone-600"
            onClick={() => setOpen(false)}
            download
          >
            Download all events (.ics)
          </a>
        </div>
      )}
    </div>
  );
}
