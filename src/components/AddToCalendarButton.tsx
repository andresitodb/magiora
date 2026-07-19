'use client';

import { useState, useRef, useEffect } from 'react';

export default function AddToCalendarButton({
  eventId,
  title,
  description,
  startsAt,
  endsAt,
  location,
}: {
  eventId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Format dates for URL params
  const start = new Date(startsAt);
  const end = endsAt
    ? new Date(endsAt)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const googleUrl = new URL('https://www.google.com/calendar/render');
  googleUrl.searchParams.set('action', 'TEMPLATE');
  googleUrl.searchParams.set('text', title);
  googleUrl.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`);
  if (description) googleUrl.searchParams.set('details', description);
  if (location) googleUrl.searchParams.set('location', location);

  // Outlook web
  const outlookUrl = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  outlookUrl.searchParams.set('path', '/calendar/action/compose');
  outlookUrl.searchParams.set('rru', 'addevent');
  outlookUrl.searchParams.set('subject', title);
  outlookUrl.searchParams.set('startdt', start.toISOString());
  outlookUrl.searchParams.set('enddt', end.toISOString());
  if (description) outlookUrl.searchParams.set('body', description);
  if (location) outlookUrl.searchParams.set('location', location);

  // Apple Calendar / generic — download .ics
  const icsUrl = `/events/${eventId}/ics`;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-white border border-stone-300 text-stone-800 py-2 px-4 rounded-md font-medium text-sm hover:bg-stone-50 cursor-pointer flex items-center gap-2"
      >
        <span>📅</span> Add to calendar
      </button>

      {open && (
        <div className="absolute z-10 right-0 mt-1 w-56 border border-stone-200 rounded-md bg-white shadow-lg overflow-hidden">
          <a
            href={googleUrl.toString()}
            target="_blank"
            rel="noopener"
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif"
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
          <a
            href={icsUrl}
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100"
            onClick={() => setOpen(false)}
          >
            Apple Calendar <span className="text-stone-400 italic text-xs">(.ics)</span>
          </a>
          <a
            href={outlookUrl.toString()}
            target="_blank"
            rel="noopener"
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100"
            onClick={() => setOpen(false)}
          >
            Outlook
          </a>
          <a
            href={icsUrl}
            className="block px-4 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif border-t border-stone-100 text-stone-600"
            onClick={() => setOpen(false)}
            download
          >
            Download .ics file
          </a>
        </div>
      )}
    </div>
  );
}
