import Link from 'next/link';
import ProfilePoweredByFooter from '@/components/ProfilePoweredByFooter';
import SocialLinksList from '@/components/SocialLinksList';
import VideoEmbed from '@/components/VideoEmbed';
import {
  getExperienceReferencePresentation,
  type ExperienceRecord,
} from '@/lib/experienceReferences';
import type { ProfilePreviewData } from '@/lib/profilePreview';
import type { Accent } from '@/lib/profile_themes';
import { getScreenPresenceSections } from '@/lib/screenPresence';
import ProfileGalleryLightbox from '@/components/ProfileGalleryLightbox';
import ProfileEmailContact from '@/components/ProfileEmailContact';
import {
  resolveProfileTemplateSettings,
  TYPOGRAPHY_SYSTEMS,
  type ProfileTemplateSettings,
  type ScreenPresenceSectionId,
} from '@/lib/profileTemplateSettings';

export default function ScreenPresenceProfile({
  data,
  accent,
  settings,
}: {
  data: ProfilePreviewData;
  accent: Accent;
  settings?: ProfileTemplateSettings;
}) {
  const name = data.displayName || 'Professional profile';
  const location = [data.city, data.state].filter(Boolean).join(', ');
  const credits = data.experience.filter((credit) =>
    credit.production || credit.title || credit.project
  );
  const equipment = (data.equipment ?? []).filter((item) => item.category || item.items);
  const socialEntries = Object.entries(data.socialLinks).filter(([, value]) => value?.trim());
  const hasPractice =
    data.skills.length > 0 || data.languages.length > 0 || equipment.length > 0;
  const hasContact =
    socialEntries.length > 0 || Boolean(data.contactEmail || data.websiteUrl);
  const resolvedSettings = settings ?? resolveProfileTemplateSettings({
    local: { templateId: 'editorial', paletteId: accent.id },
  });
  const typography = TYPOGRAPHY_SYSTEMS.find((item) => item.id === resolvedSettings.fontStyle) ?? TYPOGRAPHY_SYSTEMS[0];
  const sections = getScreenPresenceSections(data, resolvedSettings.sectionOrder);
  const sectionPosition = (id: ScreenPresenceSectionId) =>
    resolvedSettings.sectionOrder.indexOf(id);

  return (
    <article
      data-profile-template="screen-presence"
      data-typography={resolvedSettings.fontStyle}
      className={`min-h-screen scroll-smooth ${typography.bodyClass}`}
      style={{ backgroundColor: accent.background, color: accent.primaryText }}
    >
      {sections.length > 0 && (
        <header
          className="sticky top-0 z-30 border-b backdrop-blur"
          style={{ backgroundColor: `${accent.background}F2`, borderColor: accent.border }}
        >
          <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-5 px-4 sm:px-6">
            <a
              href="#top"
              className="truncate font-serif text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: accent.primaryText }}
            >
              {name}
            </a>
            <nav aria-label="Profile sections" className="hidden items-center gap-5 md:flex">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-xs font-medium uppercase tracking-[0.14em] hover:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  style={{ color: accent.secondaryText }}
                >
                  {section.label}
                </a>
              ))}
            </nav>
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-sm border px-3 py-2 text-xs font-medium uppercase tracking-[0.14em]" style={{ borderColor: accent.border }}>
                Sections
              </summary>
              <nav
                aria-label="Mobile profile sections"
                className="absolute right-0 top-12 z-40 min-w-48 rounded-sm border p-2 shadow-lg"
                style={{ backgroundColor: accent.surface, borderColor: accent.border }}
              >
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="block rounded-sm px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2">
                    {section.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </header>
      )}

      <main id="top" className="flex flex-col">
        <section className="order-[-1] mx-auto grid max-w-6xl items-center gap-9 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)] lg:gap-16 lg:py-20">
          <div
            className="mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-md"
            style={{ backgroundColor: accent.accentSoft }}
          >
            {data.headshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.headshotUrl}
                alt={`Portrait of ${name}`}
                className="h-full w-full object-cover object-[50%_22%]"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center font-serif text-3xl" style={{ color: accent.accent }}>
                {name}
              </div>
            )}
          </div>
          <div className="max-w-2xl">
            <h1 className={`mt-4 text-5xl leading-[0.92] sm:text-6xl lg:text-7xl ${typography.displayClass} ${typography.headingClass}`}>
              {name}
            </h1>
            {location && <p className="mt-5 text-base" style={{ color: accent.secondaryText }}>{location}</p>}
            {data.roles.length > 0 && (
              <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed sm:text-xl">
                {data.roles.join(' / ')}
              </p>
            )}
            {(data.demoReelUrl || data.gallery.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {data.demoReelUrl && <HeroAction href="#reel" label="Watch reel" accent={accent} />}
                {data.gallery.length > 0 && <HeroAction href="#gallery" label="Gallery" accent={accent} />}
              </div>
            )}
          </div>
        </section>

        {data.bio && (
          <ProfileSection id="about" order={sectionPosition('about')} eyebrow="About" title={`About ${name}`} accent={accent}>
            <p className="max-w-3xl whitespace-pre-line font-serif text-lg leading-8 sm:text-xl">
              {data.bio}
            </p>
            {(data.roles.length > 1 || location) && (
              <dl className="mt-8 grid max-w-3xl gap-4 border-t pt-6 sm:grid-cols-2" style={{ borderColor: accent.border }}>
                {data.roles.length > 1 && <Detail label="Roles" value={data.roles.join(', ')} accent={accent} />}
                {location && <Detail label="Based in" value={location} accent={accent} />}
              </dl>
            )}
          </ProfileSection>
        )}

        {data.gallery.length > 0 && (
          <ProfileSection id="gallery" order={sectionPosition('gallery')} eyebrow="Gallery" title="Portraits & stills" accent={accent}>
            <ProfileGalleryLightbox images={data.gallery.slice(0, 10)} name={name} accent={accent} />
          </ProfileSection>
        )}

        {data.demoReelUrl && (
          <ProfileSection id="reel" order={sectionPosition('reel')} eyebrow="Demo reel" title="Screen work" accent={accent}>
            <div className="max-w-4xl">
              <VideoEmbed url={data.demoReelUrl} label={`${name} demo reel`} accent={accent} />
            </div>
          </ProfileSection>
        )}

        {data.projects.length > 0 && (
          <ProfileSection id="work" order={sectionPosition('work')} eyebrow="Selected work" title="Recent productions" accent={accent}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.projects.slice(0, 6).map((project, index) => {
                const matchingCredit = credits.find((credit) =>
                  String(credit.production ?? credit.title ?? credit.project ?? '')
                    .trim()
                    .toLowerCase() === project.title.trim().toLowerCase()
                );
                const productionRoles = project.creditRoles?.length
                  ? project.creditRoles
                  : [project.creditRole || project.role || matchingCredit?.role].filter(
                      (role): role is string => Boolean(role),
                    );
                const productionRole = Array.from(new Set(productionRoles)).join(' / ');
                const matchedReference = matchingCredit
                  ? getExperienceReferencePresentation(matchingCredit as ExperienceRecord)
                  : null;
                const externalReference =
                  project.reference_url &&
                  (project.reference_type === 'imdb' || project.reference_type === 'official')
                    ? project.reference_url
                    : matchedReference?.href ?? null;
                const href = externalReference || (project.slug ? `/projects/${project.slug}` : null);
                const linkLabel = externalReference
                  ? matchedReference?.label === 'View on IMDb' || project.reference_type === 'imdb'
                    ? 'View on IMDb ↗'
                    : 'Official website ↗'
                  : href
                    ? 'View project →'
                    : null;
                const content = (
                  <>
                    {project.poster_url && (
                      <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: accent.accentSoft }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={project.poster_url} alt={`${project.title} artwork`} className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-serif text-xl">{project.title}</h3>
                      {(project.year || matchingCredit?.year || productionRole) && (
                        <p className="mt-1 text-sm" style={{ color: accent.secondaryText }}>
                          {[project.year || matchingCredit?.year, productionRole].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {(project.description || project.tagline || matchingCredit?.description) && (
                        <p className="mt-3 text-sm leading-relaxed" style={{ color: accent.secondaryText }}>
                          {project.description || project.tagline || matchingCredit?.description}
                        </p>
                      )}
                      {linkLabel && (
                        <p className="mt-4 text-sm font-medium underline decoration-current/40 underline-offset-4" style={{ color: accent.accent }}>
                          {linkLabel}
                        </p>
                      )}
                    </div>
                  </>
                );
                return href ? (
                  externalReference ? (
                    <a key={`${project.title}-${index}`} href={href} target="_blank" rel="noreferrer" aria-label={`${project.title} reference (opens in a new tab)`} className="overflow-hidden rounded-md border transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ backgroundColor: accent.surface, borderColor: accent.border }}>
                      {content}
                    </a>
                  ) : (
                    <Link key={`${project.title}-${index}`} href={href} className="overflow-hidden rounded-md border transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ backgroundColor: accent.surface, borderColor: accent.border }}>
                      {content}
                    </Link>
                  )
                ) : (
                  <article key={`${project.title}-${index}`} className="overflow-hidden rounded-md border" style={{ backgroundColor: accent.surface, borderColor: accent.border }}>
                    {content}
                  </article>
                );
              })}
            </div>
          </ProfileSection>
        )}

        {credits.length > 0 && (
          <ProfileSection id="credits" order={sectionPosition('credits')} eyebrow="Credits & experience" title="Selected credits" accent={accent}>
            <div className="max-w-4xl border-t" style={{ borderColor: accent.border }}>
              {credits.map((credit, index) => {
                const reference = getExperienceReferencePresentation(credit as ExperienceRecord);
                return (
                  <article key={index} className="grid gap-2 border-b py-5 sm:grid-cols-[5rem_minmax(0,1fr)_10rem] sm:items-start sm:gap-5" style={{ borderColor: accent.border }}>
                    <p className="text-sm tabular-nums" style={{ color: accent.secondaryText }}>{credit.year}</p>
                    <div>
                      <h3 className="font-serif text-lg">{credit.production || credit.title || credit.project}</h3>
                      {credit.role && <p className="mt-1 text-sm" style={{ color: accent.secondaryText }}>{credit.role}</p>}
                    </div>
                    {reference && (
                      <a href={reference.href} target="_blank" rel="noreferrer" aria-label={`${reference.label} for ${credit.production || credit.title} (opens in a new tab)`} className="text-sm font-medium underline decoration-current/40 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ color: accent.accent }}>
                        {reference.label} ↗
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </ProfileSection>
        )}

        {hasPractice && (
          <ProfileSection id="practice" order={sectionPosition('practice')} eyebrow="Professional practice" title="Skills & capabilities" accent={accent}>
            <div className="grid gap-8 md:grid-cols-3">
              {data.skills.length > 0 && <PracticeGroup title="Skills" values={data.skills} accent={accent} />}
              {data.languages.length > 0 && <PracticeGroup title="Languages" values={data.languages} accent={accent} />}
              {equipment.length > 0 && (
                <div>
                  <h3 className="font-serif text-lg">Equipment</h3>
                  <dl className="mt-4 space-y-4">
                    {equipment.map((item, index) => (
                      <div key={index}>
                        {item.category && <dt className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: accent.secondaryText }}>{item.category}</dt>}
                        {item.items && <dd className="mt-1 text-sm leading-relaxed">{item.items}</dd>}
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </ProfileSection>
        )}

        {data.recommendations.length > 0 && (
          <ProfileSection id="recommendations" order={sectionPosition('recommendations')} eyebrow="Recommendations" title="From collaborators" accent={accent}>
            <div className="grid gap-6 md:grid-cols-2">
              {data.recommendations.map((recommendation, index) => (
                <blockquote key={index} className="border-l-2 pl-5" style={{ borderColor: accent.accent }}>
                  <p className="font-serif text-lg italic leading-relaxed">“{recommendation.quote}”</p>
                  {(recommendation.from_name || recommendation.from_role) && (
                    <footer className="mt-4 text-sm" style={{ color: accent.secondaryText }}>
                      {[recommendation.from_name, recommendation.from_role].filter(Boolean).join(' · ')}
                    </footer>
                  )}
                </blockquote>
              ))}
            </div>
          </ProfileSection>
        )}

        {hasContact && (
          <ProfileSection id="contact" order={sectionPosition('contact')} eyebrow="Contact" title="Professional links" accent={accent}>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                {data.contactEmail && <ProfileEmailContact email={data.contactEmail} accent={accent} />}
                {data.websiteUrl && <ContactLink href={withScheme(data.websiteUrl)} label="Website" value={data.websiteUrl} accent={accent} external />}
              </div>
              {socialEntries.length > 0 && <SocialLinksList social={data.socialLinks} accent={accent} />}
            </div>
          </ProfileSection>
        )}
      </main>

      <ProfilePoweredByFooter surface="light" borderColor={accent.border} />
    </article>
  );
}

function HeroAction({ href, label, accent }: { href: string; label: string; accent: Accent }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center rounded-sm px-5 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{ backgroundColor: accent.buttonBackground, color: accent.buttonText }}
    >
      {label}
    </a>
  );
}

function ProfileSection({
  id,
  order,
  eyebrow,
  title,
  accent,
  children,
}: {
  id: string;
  order: number;
  eyebrow: string;
  title: string;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t px-4 py-12 sm:px-6 sm:py-16 lg:py-20" style={{ borderColor: accent.border, order }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: accent.accent }}>{eyebrow}</p>
        <h2 className="mb-8 mt-2 font-serif text-3xl sm:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Detail({ label, value, accent }: { label: string; value: string; accent: Accent }) {
  return <div><dt className="text-xs font-medium uppercase tracking-[0.14em]" style={{ color: accent.secondaryText }}>{label}</dt><dd className="mt-1 font-serif">{value}</dd></div>;
}

function PracticeGroup({ title, values, accent }: { title: string; values: string[]; accent: Accent }) {
  return (
    <div>
      <h3 className="font-serif text-lg">{title}</h3>
      <ul className="mt-4 space-y-2">
        {values.map((value) => <li key={value} className="border-b pb-2 text-sm" style={{ borderColor: accent.border }}>{value}</li>)}
      </ul>
    </div>
  );
}

function ContactLink({ href, label, value, accent, external = false }: { href: string; label: string; value: string; accent: Accent; external?: boolean }) {
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="block rounded-sm border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ borderColor: accent.border }}>
      <span className="block text-xs font-medium uppercase tracking-[0.14em]" style={{ color: accent.secondaryText }}>{label}</span>
      <span className="mt-1 block break-all font-serif text-lg" style={{ color: accent.accent }}>{value}{external ? ' ↗' : ''}</span>
    </a>
  );
}

function withScheme(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
