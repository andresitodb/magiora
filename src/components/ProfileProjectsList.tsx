import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Accent } from '@/lib/profile_themes';
import { getProjectTypeLabel } from '@/lib/projects';

export default async function ProfileProjectsList({
  profileId,
  accent,
}: {
  profileId: string;
  accent: Accent;
}) {
  const supabase = await createClient();

  // Two queries: projects owned by this person, AND projects they're credited on
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id, slug, title, project_type, year, poster_url, status')
    .eq('owner_id', profileId)
    .eq('visible', true)
    .order('year', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: creditRows } = await supabase
    .from('project_credits')
    .select(
      `role_title, character_name,
       project:projects!inner(id, slug, title, project_type, year, poster_url, status, visible, owner_id)`
    )
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  // Build a unified list (deduplicated, owned takes precedence)
  const seen = new Set<string>();
  const all: Array<{
    project: any;
    role?: string;
    character?: string | null;
    isOwner: boolean;
  }> = [];

  for (const p of ownedProjects ?? []) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    all.push({ project: p, isOwner: true });
  }
  for (const row of creditRows ?? []) {
    const p = row.project as any;
    if (!p || !p.visible) continue;
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    all.push({
      project: p,
      role: row.role_title,
      character: row.character_name,
      isOwner: p.owner_id === profileId,
    });
  }

  if (all.length === 0) return null;

  return (
    <div className="pt-6 border-t" style={{ borderColor: accent.border }}>
      <p className="font-serif italic text-sm mb-4" style={{ color: accent.accent }}>
        Projects
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {all.map(({ project, role, character, isOwner }) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="block group"
          >
            <div
              className="aspect-[3/4] rounded-md overflow-hidden mb-2"
              style={{ backgroundColor: accent.accentSoft }}
            >
              {project.poster_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={project.poster_url}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-serif italic text-sm text-center px-2"
                  style={{ color: accent.accent }}
                >
                  {project.title}
                </div>
              )}
            </div>
            <p
              className="font-serif text-sm font-medium line-clamp-2 group-hover:opacity-80 transition-opacity"
              style={{ color: accent.text }}
            >
              {project.title}
            </p>
            <p className="text-xs italic font-serif mt-0.5" style={{ color: accent.textMuted }}>
              {getProjectTypeLabel(project.project_type)}
              {project.year && ` · ${project.year}`}
            </p>
            {role && !isOwner && (
              <p className="text-xs italic font-serif mt-0.5" style={{ color: accent.accent }}>
                {role}
                {character && ` as "${character}"`}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
