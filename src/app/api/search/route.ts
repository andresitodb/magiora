import { createAnonClient } from '@/lib/supabase/anon';
import {
  MIN_SEARCH_LENGTH,
  categoryFailure,
  executeSearch,
  normalizeSearchQuery,
  searchResponseStatus,
  toIlikePattern,
  type SearchCategory,
  type SearchCategoryResult,
  type SearchErrorResponse,
  type SearchResult,
  type SearchTask,
} from '@/lib/search';

export const dynamic = 'force-dynamic';

const CATEGORY_LIMIT = 5;

function failedCategory(
  error: unknown
): SearchCategoryResult<SearchResult> {
  return { data: [], error: categoryFailure(error) };
}

function successfulCategory(
  data: SearchResult[]
): SearchCategoryResult<SearchResult> {
  return { data, error: null };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function logFailures(
  failures: Array<{
    category: SearchCategory;
    error: ReturnType<typeof categoryFailure>;
  }>
) {
  for (const failure of failures) {
    console.error('[search] category failure', {
      route: '/api/search',
      category: failure.category,
      code: failure.error.code,
      backendCode: failure.error.internalCode,
      message: failure.error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const normalized = normalizeSearchQuery(searchParams.get('q') ?? '');

  if (!normalized.ok) {
    const body: SearchErrorResponse = {
      results: [],
      partial: false,
      failedCategories: [],
      error: { code: normalized.code, message: normalized.message },
    };
    return Response.json(body, { status: 400 });
  }

  if (Array.from(normalized.query).length < MIN_SEARCH_LENGTH) {
    return Response.json({
      results: [],
      partial: false,
      failedCategories: [],
    });
  }

  const supabase = createAnonClient();
  const pattern = toIlikePattern(normalized.query);

  const tasks: Record<SearchCategory, SearchTask> = {
    profiles: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'slug, display_name, role_category, role_titles, custom_role_label, location_city, headshot_url'
        )
        .eq('visible', true)
        .eq('approved', true)
        .ilike('display_name', pattern)
        .limit(CATEGORY_LIMIT);
      if (error) return failedCategory(error);

      return successfulCategory(
        (data ?? []).flatMap((profile): SearchResult[] => {
          if (!profile.slug || !profile.display_name) return [];
          const roleTitle =
            (profile.role_titles ?? [])[0] ??
            (profile.role_category === 'crew_other'
              ? profile.custom_role_label
              : profile.role_category?.replace('_', ' '));
          return [
            {
              kind: 'profile',
              id: profile.slug,
              title: profile.display_name,
              subtitle: [roleTitle, profile.location_city]
                .filter(Boolean)
                .join(' · '),
              href: `/m/${encodeURIComponent(profile.slug)}`,
              thumbnail: profile.headshot_url,
            },
          ];
        })
      );
    },

    projects: async () => {
      const columns =
        'id, slug, title, tagline, description, project_type, year, poster_url';
      const searches = await Promise.all([
        supabase
          .from('projects')
          .select(columns)
          .eq('visible', true)
          .ilike('title', pattern)
          .limit(CATEGORY_LIMIT),
        supabase
          .from('projects')
          .select(columns)
          .eq('visible', true)
          .ilike('tagline', pattern)
          .limit(CATEGORY_LIMIT),
        supabase
          .from('projects')
          .select(columns)
          .eq('visible', true)
          .ilike('description', pattern)
          .limit(CATEGORY_LIMIT),
      ]);
      const error = searches.find((result) => result.error)?.error;
      if (error) return failedCategory(error);

      const projects = uniqueById(
        searches.flatMap((result) => result.data ?? [])
      ).slice(0, CATEGORY_LIMIT);
      return successfulCategory(
        projects.flatMap((project): SearchResult[] => {
          if (!project.slug || !project.title) return [];
          return [
            {
              kind: 'project',
              id: project.id,
              title: project.title,
              subtitle: [
                project.project_type?.replace('_', ' '),
                project.year,
                project.tagline,
              ]
                .filter(Boolean)
                .join(' · '),
              href: `/projects/${encodeURIComponent(project.slug)}`,
              thumbnail: project.poster_url,
            },
          ];
        })
      );
    },

    castings: async () => {
      const columns =
        'id, project_title, role_name, project_type, location_city';
      const searches = await Promise.all([
        supabase
          .from('casting_calls')
          .select(columns)
          .eq('status', 'open')
          .ilike('project_title', pattern)
          .limit(CATEGORY_LIMIT),
        supabase
          .from('casting_calls')
          .select(columns)
          .eq('status', 'open')
          .ilike('role_name', pattern)
          .limit(CATEGORY_LIMIT),
      ]);
      const error = searches.find((result) => result.error)?.error;
      if (error) return failedCategory(error);

      const calls = uniqueById(
        searches.flatMap((result) => result.data ?? [])
      ).slice(0, CATEGORY_LIMIT);
      return successfulCategory(
        calls.flatMap((call): SearchResult[] => {
          if (!call.id || !call.project_title) return [];
          return [
            {
              kind: 'casting_call',
              id: call.id,
              title: call.project_title,
              subtitle: [
                call.role_name,
                call.project_type?.replace('_', ' '),
                call.location_city,
              ]
                .filter(Boolean)
                .join(' · '),
              href: `/casting-calls/${encodeURIComponent(call.id)}`,
              thumbnail: null,
            },
          ];
        })
      );
    },

    events: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, location_name, cover_image_url')
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())
        .ilike('title', pattern)
        .limit(CATEGORY_LIMIT);
      if (error) return failedCategory(error);

      return successfulCategory(
        (data ?? []).flatMap((event): SearchResult[] => {
          if (!event.id || !event.title) return [];
          const date = new Date(event.event_date);
          const dateLabel = Number.isNaN(date.getTime())
            ? null
            : date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
          return [
            {
              kind: 'event',
              id: event.id,
              title: event.title,
              subtitle: [dateLabel, event.location_name]
                .filter(Boolean)
                .join(' · '),
              href: `/events/${encodeURIComponent(event.id)}`,
              thumbnail: event.cover_image_url,
            },
          ];
        })
      );
    },

    spotlight: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(
          'id, slug, title, hero_image_url, subject:profiles!interviews_subject_profile_id_fkey(display_name)'
        )
        .eq('status', 'published')
        .ilike('title', pattern)
        .limit(CATEGORY_LIMIT);
      if (error) return failedCategory(error);

      return successfulCategory(
        (data ?? []).flatMap((story): SearchResult[] => {
          if (!story.slug || !story.title) return [];
          const subject = Array.isArray(story.subject)
            ? story.subject[0]
            : story.subject;
          return [
            {
              kind: 'story',
              id: story.id,
              title: story.title,
              subtitle: subject?.display_name
                ? `On ${subject.display_name}`
                : null,
              href: `/stories/${encodeURIComponent(story.slug)}`,
              thumbnail: story.hero_image_url,
            },
          ];
        })
      );
    },
  };

  const { response, failures } = await executeSearch(tasks);
  if (failures.length > 0) logFailures(failures);

  const status = searchResponseStatus(failures.length);
  if (status === 503) {
    const body: SearchErrorResponse = {
      ...response,
      error: {
        code: 'SEARCH_UNAVAILABLE',
        message: 'Search is temporarily unavailable. Please try again.',
      },
    };
    return Response.json(body, { status });
  }

  return Response.json(response);
}
