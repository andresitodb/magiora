import { createAnonClient } from '@/lib/supabase/anon';
import { buildIcsFile } from '@/lib/ics';

export const revalidate = 300; // 5 minutes

export async function GET() {
  const supabase = createAnonClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, title, description, event_date, end_date, location_name, location_address, online_link')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(200);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const ics = buildIcsFile(events ?? [], siteUrl, 'Kinora — upcoming events');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kinora-events.ics"',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
