export type DashboardProfile = {
  id?: string;
  display_name?: string | null;
  headshot_url?: string | null;
  role_titles?: string[] | null;
  role_category?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  bio?: string | null;
  languages?: string[] | null;
  skills?: string[] | null;
  gallery?: string[] | null;
  demo_reel_url?: string | null;
  video_links?: unknown[] | null;
  experience?: unknown[] | null;
  website_url?: string | null;
  social_links?: Record<string, unknown> | null;
  slug?: string | null;
  visible?: boolean | null;
  approved?: boolean | null;
  verified?: boolean | null;
};

export type CompletenessItem = {
  key: string;
  label: string;
  actionLabel: string;
  href: string;
  complete: boolean;
};

export type DashboardCompleteness = {
  percent: number;
  completed: number;
  total: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
};

function hasText(value: string | null | undefined, minimum = 1) {
  return (value?.trim().length ?? 0) >= minimum;
}

function hasExternalLink(profile: DashboardProfile) {
  if (hasText(profile.website_url)) return true;
  return Object.values(profile.social_links ?? {}).some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
}

export function computeDashboardCompleteness(
  profile: DashboardProfile,
  linkedCreditCount = 0,
): DashboardCompleteness {
  const items: CompletenessItem[] = [
    {
      key: 'portrait',
      label: 'Add a professional portrait',
      actionLabel: 'Add portrait',
      href: '/dashboard/profile#photos',
      complete: hasText(profile.headshot_url),
    },
    {
      key: 'name',
      label: 'Confirm your professional name',
      actionLabel: 'Add professional name',
      href: '/dashboard/profile#identity',
      complete: hasText(profile.display_name),
    },
    {
      key: 'role',
      label: 'Add at least one professional role',
      actionLabel: 'Add professional role',
      href: '/dashboard/profile#roles',
      complete: (profile.role_titles?.length ?? 0) > 0,
    },
    {
      key: 'location',
      label: 'Add your city',
      actionLabel: 'Add location',
      href: '/dashboard/profile#location',
      complete: hasText(profile.location_city),
    },
    {
      key: 'bio',
      label: 'Write a professional bio',
      actionLabel: 'Write bio',
      href: '/dashboard/profile#bio',
      complete: hasText(profile.bio, 80),
    },
    {
      key: 'languages',
      label: 'Add at least one language',
      actionLabel: 'Add languages',
      href: '/dashboard/profile#languages',
      complete: (profile.languages?.length ?? 0) > 0,
    },
    {
      key: 'skills',
      label: 'Add at least one professional skill',
      actionLabel: 'Add skills',
      href: '/dashboard/profile#skills',
      complete: (profile.skills?.length ?? 0) > 0,
    },
    {
      key: 'portfolio',
      label: 'Add portfolio media',
      actionLabel: 'Add portfolio media',
      href: '/dashboard/profile#portfolio',
      complete:
        (profile.gallery?.length ?? 0) > 0 ||
        hasText(profile.demo_reel_url) ||
        (profile.video_links?.length ?? 0) > 0,
    },
    {
      key: 'credits',
      label: 'Add at least one professional credit',
      actionLabel: 'Add a credit',
      href: '/dashboard/profile#experience',
      complete: (profile.experience?.length ?? 0) > 0 || linkedCreditCount > 0,
    },
    {
      key: 'links',
      label: 'Add a website or professional link',
      actionLabel: 'Add external link',
      href: '/dashboard/profile#contact',
      complete: hasExternalLink(profile),
    },
  ];

  const completed = items.filter((item) => item.complete).length;
  return {
    percent: Math.round((completed / items.length) * 100),
    completed,
    total: items.length,
    items,
    missing: items.filter((item) => !item.complete),
  };
}

export type DashboardAction = {
  key: string;
  label: string;
  href: string;
  primary?: boolean;
};

export function getDashboardQuickActions(
  profile: DashboardProfile,
  completeness: DashboardCompleteness,
): DashboardAction[] {
  const actions: DashboardAction[] = completeness.missing.slice(0, 3).map((item, index) => ({
    key: item.key,
    label: item.actionLabel,
    href: item.href,
    primary: index === 0,
  }));

  if (profile.slug && profile.visible && profile.approved) {
    actions.push({ key: 'public-profile', label: 'View public profile', href: `/m/${profile.slug}` });
  }
  actions.push({ key: 'browse-projects', label: 'Browse projects', href: '/projects' });
  actions.push({ key: 'browse-casting', label: 'Browse casting calls', href: '/casting-calls' });

  return actions.slice(0, 6);
}

export type DashboardProject = {
  id: string;
  slug: string | null;
  title: string;
  status: string | null;
  visible: boolean;
  updated_at?: string | null;
};

export type DashboardProjectRelationship = {
  project: DashboardProject;
  relationships: Array<'owner' | 'credited'>;
  role: string;
  nextHref: string | null;
  nextLabel: string;
};

export function mergeDashboardProjects(
  owned: DashboardProject[],
  credited: Array<{ project: DashboardProject | null; role_title?: string | null }>,
): DashboardProjectRelationship[] {
  const merged = new Map<string, DashboardProjectRelationship>();

  for (const project of owned) {
    merged.set(project.id, {
      project,
      relationships: ['owner'],
      role: 'Project owner',
      nextHref: `/dashboard/projects/${project.id}/edit`,
      nextLabel: 'Manage project',
    });
  }

  for (const credit of credited) {
    if (!credit.project) continue;
    const existing = merged.get(credit.project.id);
    if (existing) {
      if (!existing.relationships.includes('credited')) existing.relationships.push('credited');
      if (credit.role_title?.trim()) existing.role = credit.role_title.trim();
      continue;
    }
    merged.set(credit.project.id, {
      project: credit.project,
      relationships: ['credited'],
      role: credit.role_title?.trim() || 'Credited professional',
      nextHref: credit.project.visible && credit.project.slug ? `/projects/${credit.project.slug}` : null,
      nextLabel: credit.project.visible ? 'View project' : 'Project is private',
    });
  }

  return [...merged.values()].sort((a, b) =>
    (b.project.updated_at ?? '').localeCompare(a.project.updated_at ?? ''),
  );
}

export type DashboardApplication = {
  id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  casting_call: {
    id: string;
    project_title: string;
    role_name: string;
    status: string;
    application_deadline?: string | null;
  } | null;
};

export function selectAuthorizedCastingActivity(
  applications: DashboardApplication[],
  userId: string,
) {
  return applications
    .filter((application) => application.applicant_id === userId && application.casting_call)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getPublicProfileState(profile: DashboardProfile) {
  if (!profile.slug) return { label: 'Profile link not ready', canView: false };
  if (!profile.approved) return { label: 'Awaiting approval', canView: false };
  if (!profile.visible) return { label: 'Private', canView: false };
  return { label: 'Public', canView: true };
}

export const DASHBOARD_EMPTY_STATES = {
  projects: {
    title: 'Add your first project or credit',
    body: 'Projects you own and projects where you are credited will appear together here.',
    actionLabel: 'Create a project',
    href: '/dashboard/projects/new',
  },
  casting: {
    title: 'Explore open casting opportunities',
    body: 'Your applications and their current status will appear here after you apply.',
    actionLabel: 'Browse casting calls',
    href: '/casting-calls',
  },
  activity: {
    title: 'Your professional activity starts here',
    body: 'Profile, project, casting, event, and Spotlight updates will appear here when they happen.',
  },
} as const;
