import { createAnonClient } from '@/lib/supabase/anon';
import { buildIcsFile } from '@/lib/ics';
import { notFound } from 'next/navigation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAnonClient();

  const { data: event } = await supabase
    .from('events')
    .select('id, title, description, event_date, end_date, location_name, location_address, online_link, status')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();

  if (!event) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const ics = buildIcsFile([event], siteUrl, event.title);

  // Slug for filename
  const filename =
    event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    `event-${event.id}`;

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.ics"`,
    },
  });
}
