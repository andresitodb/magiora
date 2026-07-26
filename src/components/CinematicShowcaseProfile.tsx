'use client';
/* eslint-disable @next/next/no-img-element -- Profile media may use user-configured remote hosts. */

import Link from 'next/link';
import { useState } from 'react';
import ProfilePoweredByFooter from '@/components/ProfilePoweredByFooter';
import ProfileEmailContact from '@/components/ProfileEmailContact';
import ProfileGalleryLightbox from '@/components/ProfileGalleryLightbox';
import SocialLinksList from '@/components/SocialLinksList';
import VideoEmbed from '@/components/VideoEmbed';
import { getCinematicCareerSnapshot, getShortBiography } from '@/lib/cinematicSnapshot';
import type { ProfilePreviewData, PreviewProject } from '@/lib/profilePreview';
import type { Accent } from '@/lib/profile_themes';
import { CINEMATIC_PAGES, type CinematicHomeSectionId, type CinematicPageId } from '@/lib/profileTemplateRegistry';
import { resolveProfileTemplateSettings, TYPOGRAPHY_SYSTEMS, type ProfileTemplateSettings } from '@/lib/profileTemplateSettings';

const PAGE_LABELS: Record<CinematicPageId, string> = {
  home: 'Home', about: 'About', portfolio: 'Portfolio', reel: 'Reel',
  credits: 'Credits', gallery: 'Gallery', equipment: 'Equipment', contact: 'Contact',
};

export function getCinematicAvailablePages(data: ProfilePreviewData): CinematicPageId[] {
  const hasContact = Boolean(
    data.contactEmail || data.phone || data.websiteUrl ||
    data.representation?.agency || data.representation?.manager ||
    Object.values(data.socialLinks).some(Boolean),
  );
  return CINEMATIC_PAGES.filter((page) => ({
    home: true,
    about: true,
    portfolio: data.projects.length > 0,
    reel: Boolean(data.demoReelUrl || data.videoLinks?.length),
    credits: data.experience.length > 0,
    gallery: data.gallery.length > 0,
    equipment: Boolean(data.equipment?.length),
    contact: hasContact,
  })[page]);
}

export default function CinematicShowcaseProfile({
  data, accent, slug, page = 'home', settings, preview = false, onNavigate,
}: {
  data: ProfilePreviewData;
  accent: Accent;
  slug?: string;
  page?: CinematicPageId;
  settings?: ProfileTemplateSettings;
  preview?: boolean;
  onNavigate?: (page: CinematicPageId) => void;
}) {
  const resolved = settings ?? resolveProfileTemplateSettings({ legacyTemplate: 'cinematic', legacyAccent: accent.id });
  const typography = TYPOGRAPHY_SYSTEMS.find((item) => item.id === resolved.fontStyle) ?? TYPOGRAPHY_SYSTEMS[4];
  const navigation = resolved.navigationOrder.filter((item) => getCinematicAvailablePages(data).includes(item));
  const [menuOpen, setMenuOpen] = useState(false);
  const featuredProject = data.projects.find((project) => project.featured_at) ?? data.projects[0];
  const heroImage = data.heroImageUrl ||
    data.projects.find((project) => project.featured_at && project.poster_url)?.poster_url ||
    data.projects.find((project) => project.poster_url)?.poster_url ||
    data.gallery[0] || data.headshotUrl;
  const readingClass = {
    small: 'text-sm leading-7',
    medium: 'text-base leading-8',
    large: 'text-lg leading-9',
  }[resolved.readingScale];

  const hrefFor = (target: CinematicPageId) =>
    preview ? '#' : target === 'home' ? `/m/${slug}` : `/m/${slug}/${target}`;
  const navigate = (event: React.MouseEvent, target: CinematicPageId) => {
    setMenuOpen(false);
    if (preview) {
      event.preventDefault();
      onNavigate?.(target);
    }
  };

  return (
    <div className={`min-h-screen ${typography.bodyClass}`} style={{ backgroundColor: accent.background, color: accent.primaryText }} data-template="cinematic-showcase" data-page={page} data-typography={typography.id} data-reading-scale={resolved.readingScale}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-md" style={{ borderColor: accent.border, backgroundColor: `${accent.background}F2` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">
          <Link href={hrefFor('home')} onClick={(event) => navigate(event, 'home')} className={`${typography.displayClass} ${typography.displayWeightClass} text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4`}>
            {data.displayName || 'Cinematic Showcase'}
          </Link>
          <button type="button" className="rounded-sm border px-3 py-2 text-xs uppercase tracking-widest md:hidden" style={{ borderColor: accent.border }} aria-expanded={menuOpen} aria-controls="cinematic-navigation" onClick={() => setMenuOpen((value) => !value)}>Menu</button>
          <nav id="cinematic-navigation" aria-label="Portfolio navigation" className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col border-b p-5 md:static md:flex md:w-auto md:flex-row md:border-0 md:p-0`} style={{ backgroundColor: accent.background, borderColor: accent.border }}>
            {navigation.map((target) => (
              <Link key={target} href={hrefFor(target)} onClick={(event) => navigate(event, target)} aria-current={page === target ? 'page' : undefined}
                className={`px-3 py-2 text-xs ${typography.navClass} focus-visible:outline focus-visible:outline-2 ${page === target ? 'underline underline-offset-8' : 'opacity-65 hover:opacity-100'}`}>
                {PAGE_LABELS[target]}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {page === 'home' && <HomePage data={data} accent={accent} heroImage={heroImage} featuredProject={featuredProject} order={resolved.homeSectionOrder} typography={typography} readingClass={readingClass} preview={preview} slug={slug} onNavigate={onNavigate} />}
        {page === 'about' && <AboutPage data={data} typography={typography} readingClass={readingClass} />}
        {page === 'portfolio' && <PortfolioPage data={data} accent={accent} typography={typography} readingClass={readingClass} />}
        {page === 'reel' && <ReelPage data={data} accent={accent} typography={typography} />}
        {page === 'credits' && <CreditsPage data={data} accent={accent} typography={typography} readingClass={readingClass} />}
        {page === 'gallery' && <GalleryPage data={data} accent={accent} typography={typography} />}
        {page === 'equipment' && <EquipmentPage data={data} accent={accent} typography={typography} />}
        {page === 'contact' && <ContactPage data={data} accent={accent} typography={typography} />}
      </main>

      <ProfilePoweredByFooter
        surface={['noir', 'deep-burgundy', 'midnight-blue'].includes(accent.id) ? 'dark' : 'light'}
        borderColor={accent.border}
      />
    </div>
  );
}

type Typography = (typeof TYPOGRAPHY_SYSTEMS)[number];
const PageTitle = ({ eyebrow, title, typography }: { eyebrow: string; title: string; typography: Typography }) => (
  <header className="mx-auto max-w-7xl px-5 pb-10 pt-20 lg:px-10 lg:pt-28">
    <p className={`text-xs uppercase opacity-60 ${typography.metadataClass}`}>{eyebrow}</p>
    <h1 className={`mt-4 max-w-5xl text-5xl leading-[0.92] sm:text-7xl lg:text-8xl ${typography.displayClass} ${typography.headingClass} ${typography.displayWeightClass}`}>{title}</h1>
  </header>
);

function HomePage({ data, accent, heroImage, featuredProject, order, typography, readingClass, preview, slug, onNavigate }: {
  data: ProfilePreviewData; accent: Accent; heroImage?: string | null; featuredProject?: PreviewProject;
  order: CinematicHomeSectionId[]; typography: Typography; readingClass: string;
  preview: boolean; slug?: string; onNavigate?: (page: CinematicPageId) => void;
}) {
  const sections: Record<CinematicHomeSectionId, React.ReactNode> = {
    introduction: data.bio ? <section className="mx-auto max-w-3xl px-5 py-16 text-center lg:py-20"><p className="text-xs uppercase tracking-[0.22em] opacity-60">{data.roles.slice(0, 2).join(' / ') || 'About'}</p><p className={`mt-5 line-clamp-4 ${readingClass}`}>{getShortBiography(data.bio)}</p><PageLink page="about" preview={preview} slug={slug} onNavigate={onNavigate}>About</PageLink></section> : null,
    featured_work: featuredProject ? <ProjectFeature project={featuredProject} accent={accent} typography={typography} readingClass={readingClass} /> : null,
    gallery_preview: data.gallery.length ? <section className="mx-auto max-w-5xl px-5 py-16"><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{data.gallery.slice(0, 3).map((image, index) => <div key={image} className={`${index === 0 ? 'col-span-2 md:col-span-1' : ''} flex aspect-[4/3] max-h-60 items-center justify-center overflow-hidden p-2`} style={{ backgroundColor: accent.surface }}><img src={image} alt={`${data.displayName} gallery image ${index + 1}`} className="h-full w-full object-contain" /></div>)}</div><div className="text-center"><PageLink page="gallery" preview={preview} slug={slug} onNavigate={onNavigate}>View gallery</PageLink></div></section> : null,
    selected_credits: null,
    contact_cta: (data.contactEmail || data.phone || data.websiteUrl) ? <section className="mx-auto max-w-4xl px-5 py-24 text-center"><p className={`text-3xl sm:text-5xl ${typography.displayClass}`}>Let’s work together.</p><PageLink page="contact" preview={preview} slug={slug} onNavigate={onNavigate}>Contact</PageLink></section> : null,
  };
  return <>
    <section className="relative min-h-[78vh] overflow-hidden">
      {heroImage ? <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /> : <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 68% 28%, ${accent.accentSoft}, ${accent.overlayBackground} 58%)` }} />}
      <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${accent.overlayBackground}F2 0%, ${accent.overlayBackground}20 75%)` }} />
      <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-5 py-16 text-white lg:px-10 lg:py-24">
        {data.roles.length > 0 && <p className={`text-xs uppercase ${typography.metadataClass}`}>{data.roles.join(' / ')}</p>}
        <h1 className={`mt-5 max-w-5xl text-6xl leading-[0.88] sm:text-8xl lg:text-[8rem] ${typography.displayClass} ${typography.headingClass} ${typography.displayWeightClass}`}>{data.displayName}</h1>
        {(data.city || data.country || data.state) && <p className="mt-6 text-sm opacity-80">{[data.city, data.country || data.state].filter(Boolean).join(', ')}</p>}
      </div>
    </section>
    {!data.bio && <CareerSnapshot data={data} accent={accent} />}
    {order.map((section) => sections[section] ? <div key={section}>{sections[section]}{section === 'introduction' && <CareerSnapshot data={data} accent={accent} />}</div> : null)}
  </>;
}

function PageLink({ page, preview, slug, onNavigate, children }: { page: CinematicPageId; preview: boolean; slug?: string; onNavigate?: (page: CinematicPageId) => void; children: React.ReactNode }) {
  return <Link href={preview ? '#' : `/m/${slug}/${page}`} onClick={(event) => { if (preview) { event.preventDefault(); onNavigate?.(page); } }} className="mt-6 inline-flex border-b pb-1 text-sm uppercase tracking-widest focus-visible:outline focus-visible:outline-2">{children} →</Link>;
}
function projectRoles(project: PreviewProject) { return Array.from(new Set([...(project.creditRoles ?? []), project.creditRole, project.role].filter(Boolean))).join(' / '); }
function CareerSnapshot({ data, accent }: { data: ProfilePreviewData; accent: Accent }) {
  const metrics = getCinematicCareerSnapshot(data);
  if (metrics.length === 0) return null;
  return <section aria-label="Career snapshot" className="mx-auto max-w-5xl px-5 pb-12"><div className="grid grid-cols-2 border-y sm:grid-cols-4" style={{ borderColor: accent.border }}>{metrics.map((metric) => <div key={metric.id} aria-label={`${metric.value} ${metric.label}`} className="px-3 py-4 text-center sm:px-5"><span className="block font-serif text-2xl" style={{ color: accent.accent }}>{metric.value}</span><span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.secondaryText }}>{metric.label}</span></div>)}</div></section>;
}
function ProjectFeature({ project, accent, typography, readingClass }: { project: PreviewProject; accent: Accent; typography: Typography; readingClass: string }) {
  return <section className="mx-auto grid max-w-5xl gap-9 px-5 py-16 md:grid-cols-[1fr_0.8fr] lg:py-20">{project.poster_url && <div className="flex min-h-60 items-center justify-center p-4" style={{ backgroundColor: accent.surface }}><img src={project.poster_url} alt={`${project.title} artwork`} className="max-h-[26rem] w-full object-contain" /></div>}<div className="flex flex-col justify-center"><p className="text-xs uppercase tracking-widest opacity-60">Featured production</p><h2 className={`mt-4 text-3xl sm:text-4xl ${typography.displayClass}`}>{project.title}</h2><p className="mt-4 text-sm opacity-70">{[project.year, projectRoles(project)].filter(Boolean).join(' · ')}</p>{(project.description || project.tagline) && <p className={`mt-6 opacity-80 ${readingClass}`}>{project.description || project.tagline}</p>}<ProjectLinks project={project} accent={accent} /></div></section>;
}
function ProjectLinks({ project, accent }: { project: PreviewProject; accent: Accent }) {
  return <div className="mt-6 flex flex-wrap gap-4 text-sm">{project.reference_url && project.reference_type === 'imdb' && <a href={project.reference_url} target="_blank" rel="noreferrer">View on IMDb ↗</a>}{project.reference_url && project.reference_type === 'official' && <a href={project.reference_url} target="_blank" rel="noreferrer">Official website ↗</a>}{project.slug && <Link href={`/projects/${project.slug}`} style={{ color: accent.accent }}>View project →</Link>}</div>;
}
function PortfolioPage({ data, accent, typography, readingClass }: { data: ProfilePreviewData; accent: Accent; typography: Typography; readingClass: string }) {
  return <><PageTitle eyebrow="Selected work" title="Portfolio" typography={typography} /><div className="mx-auto max-w-7xl px-5 pb-24 lg:px-10">{data.projects.map((project, index) => <article key={project.slug || project.title} className={`grid gap-10 border-t py-16 md:grid-cols-2 ${index % 2 ? 'md:[&>div:first-child]:order-2' : ''}`} style={{ borderColor: accent.border }}>{project.poster_url && <div className="flex min-h-72 items-center justify-center p-5" style={{ backgroundColor: accent.surface }}><img src={project.poster_url} alt={`${project.title} artwork`} className="max-h-[32rem] w-full object-contain" /></div>}<div className="flex flex-col justify-center"><p className="text-xs uppercase tracking-widest opacity-60">{[project.year, project.project_type].filter(Boolean).join(' · ')}</p><h2 className={`mt-3 text-4xl sm:text-5xl ${typography.displayClass}`}>{project.title}</h2>{projectRoles(project) && <p className="mt-4">{projectRoles(project)}</p>}{(project.description || project.tagline) && <p className={`mt-5 opacity-70 ${readingClass}`}>{project.description || project.tagline}</p>}<ProjectLinks project={project} accent={accent} /></div></article>)}</div></>;
}
function ReelPage({ data, accent, typography }: { data: ProfilePreviewData; accent: Accent; typography: Typography }) {
  const videos = [{ label: 'Primary reel', url: data.demoReelUrl }, ...(data.videoLinks ?? [])].filter((item) => item.url);
  return <><PageTitle eyebrow="Moving image" title="Reel" typography={typography} /><div className="mx-auto max-w-6xl space-y-16 px-5 pb-24 lg:px-10">{videos.map((video, index) => <section key={`${video.url}-${index}`}><h2 className={`mb-5 ${index ? 'text-2xl' : 'text-4xl'} ${typography.displayClass}`}>{video.label}</h2><VideoEmbed url={video.url} accent={accent} label={video.label} /></section>)}</div></>;
}
function CreditsPage({ data, accent, typography, readingClass }: { data: ProfilePreviewData; accent: Accent; typography: Typography; readingClass: string }) {
  return <><PageTitle eyebrow="Selected experience" title="Credits" typography={typography} /><ol className="mx-auto max-w-6xl px-5 pb-24 lg:px-10">{data.experience.map((credit, index) => { const project = data.projects.find((item) => item.title === (credit.production || credit.title || credit.project)); return <li key={index} className="grid gap-3 border-t py-6 sm:grid-cols-[7rem_1fr_1fr] sm:gap-8" style={{ borderColor: accent.border }}><span className="opacity-60">{credit.year}</span><div><h2 className={`text-xl ${typography.displayClass}`}>{credit.production || credit.title || credit.project}</h2>{credit.description && <p className={`mt-2 opacity-70 ${readingClass}`}>{credit.description}</p>}</div><div><p>{credit.role}</p><CreditLinks credit={credit} project={project} /></div></li>;})}</ol></>;
}
function CreditLinks({ credit, project }: { credit: ProfilePreviewData['experience'][number]; project?: PreviewProject }) {
  const label = credit.reference_type === 'imdb' ? 'IMDb' : credit.reference_type === 'official' ? 'Official Website' : null;
  return <div className="mt-3 flex flex-wrap gap-4 text-sm">{credit.reference_url && label && <a href={credit.reference_url} target="_blank" rel="noreferrer">{label} ↗</a>}{project?.slug && <Link href={`/projects/${project.slug}`}>Magiora Project →</Link>}</div>;
}
function AboutPage({ data, typography, readingClass }: { data: ProfilePreviewData; typography: Typography; readingClass: string }) {
  return <><PageTitle eyebrow="Professional practice" title="About" typography={typography} /><div className="mx-auto grid max-w-6xl gap-14 px-5 pb-24 md:grid-cols-[0.72fr_1.28fr] lg:px-10">{data.headshotUrl && <img src={data.headshotUrl} alt={`${data.displayName} portrait`} className="aspect-[4/5] w-full object-cover" />}<div>{data.bio && <p className={`max-w-2xl opacity-90 ${readingClass}`}>{data.bio}</p>}{data.roles.length > 0 && <Detail title="Disciplines" values={data.roles} />}{data.languages.length > 0 && <Detail title="Languages" values={data.languages} />}{data.skills.length > 0 && <Detail title="Skills" values={data.skills} />}</div></div></>;
}
function Detail({ title, values }: { title: string; values: string[] }) { return <section className="mt-10"><h2 className="text-xs uppercase tracking-widest opacity-60">{title}</h2><p className="mt-3 leading-relaxed">{values.join(' · ')}</p></section>; }
function GalleryPage({ data, accent, typography }: { data: ProfilePreviewData; accent: Accent; typography: Typography }) { return <><PageTitle eyebrow="Selected images" title="Gallery" typography={typography} /><div className="px-5 pb-24"><ProfileGalleryLightbox images={data.gallery} name={data.displayName} accent={accent} /></div></>; }
function EquipmentPage({ data, accent, typography }: { data: ProfilePreviewData; accent: Accent; typography: Typography }) {
  return <><PageTitle eyebrow="Professional tools" title="Equipment" typography={typography} /><div className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">{data.equipment?.map((group, index) => <section key={`${group.category}-${index}`} className="border p-6" style={{ borderColor: accent.border, backgroundColor: accent.surface }}><h2 className={`text-2xl ${typography.displayClass}`}>{group.category || 'Equipment'}</h2>{group.items && <p className="mt-4 leading-7 opacity-75">{group.items}</p>}</section>)}</div></>;
}
function ContactPage({ data, accent, typography }: { data: ProfilePreviewData; accent: Accent; typography: Typography }) {
  const rep = data.representation;
  return <><PageTitle eyebrow="Enquiries" title="Contact" typography={typography} /><div className="mx-auto grid max-w-5xl gap-12 px-5 pb-24 md:grid-cols-2 lg:px-10"><div>{data.contactEmail && <ProfileEmailContact email={data.contactEmail} accent={accent} />}{data.phone && <a href={`tel:${data.phone.replace(/[^+\d]/g, '')}`} className="mt-5 block">{data.phone}</a>}{data.websiteUrl && <a href={data.websiteUrl} target="_blank" rel="noreferrer" className="mt-5 block">Official website ↗</a>}<p className="mt-5 opacity-70">{[data.city, data.country || data.state].filter(Boolean).join(', ')}</p></div><div>{rep && (rep.agency || rep.manager || rep.agent) && <section><h2 className={`text-2xl ${typography.displayClass}`}>Representation</h2><p className="mt-4">{[rep.agency, rep.manager, rep.agent].filter(Boolean).join(' · ')}</p>{rep.email && <a href={`mailto:${rep.email}`} className="mt-3 block">{rep.email}</a>}{rep.phone && <a href={`tel:${rep.phone.replace(/[^+\d]/g, '')}`} className="mt-3 block">{rep.phone}</a>}{rep.website && <a href={rep.website} target="_blank" rel="noreferrer" className="mt-3 block">Representation website ↗</a>}</section>}<div className="mt-8"><SocialLinksList social={data.socialLinks} accent={accent} /></div></div></div></>;
}
