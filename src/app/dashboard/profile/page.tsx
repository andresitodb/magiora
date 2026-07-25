import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasPaidMembership } from '@/lib/billingServer';
import { computeDashboardCompleteness } from '@/lib/dashboardFoundation';
import {
  getChapterProgress,
  getProfilePublicStatus,
} from '@/lib/profileExperience';
import { updateProfile, changePassword, requestVerified } from './actions';
import ProfileMediaSection from './ProfileMediaSection';
import AutoGrowTextarea from '@/components/AutoGrowTextarea';
import LanguageSelector from '@/components/LanguageSelector';
import VideoLinksManager from '@/components/VideoLinksManager';
import SkillsAutocomplete from '@/components/SkillsAutocomplete';
import StateSelector from '@/components/StateSelector';
import SlugEditor from '@/components/SlugEditor';
import ExperienceEditor from '@/components/ExperienceEditor';
import RecommendationsEditor from '@/components/RecommendationsEditor';
import EquipmentEditor from '@/components/EquipmentEditor';
import ContactEditor from '@/components/ContactEditor';
import RoleSection from '@/components/RoleSection';
import ThemeSelector from '@/components/ThemeSelector';
import VerifiedRequestForm from '@/components/VerifiedRequestForm';
import BackLink from '@/components/BackLink';
import Toast from '@/components/Toast';
import {
  ProfileChapterNavigation,
} from '@/components/ProfileEditorExperience';
import ProfileMainForm from '@/components/ProfileEditorExperience';
import { SectionIcons } from '@/components/SectionIcons';
import MemberEdition from '@/components/MemberEdition';

const FREE_SKILL_LIMIT = 5;

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[#993C1D]">{icon}</span>
      <h3 className="font-serif text-sm italic text-[#993C1D]">{label}</h3>
    </div>
  );
}

function ChapterHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6 border-b border-stone-200 pb-4">
      <p className="k-eyebrow mb-2">Chapter {number}</p>
      <h2 className="font-serif text-2xl font-medium">{title}</h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-600">{description}</p>
    </header>
  );
}

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; toast?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: linkedCredits, count: linkedCreditCount }, { data: ownedPreviewProjects }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('project_credits')
      .select('id, project:projects(title, tagline, poster_url)', { count: 'exact' })
      .eq('profile_id', user!.id),
    supabase
      .from('projects')
      .select('title, tagline, poster_url')
      .eq('owner_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(6),
  ]);

  if (!profile) return null;

  const creditedPreviewProjects = (linkedCredits ?? []).flatMap((credit) => {
    const related = Array.isArray(credit.project) ? credit.project[0] : credit.project;
    const project = related as
      | { title: string; tagline: string | null; poster_url: string | null }
      | null
      | undefined;
    return project ? [project] : [];
  });
  const previewProjects = [...(ownedPreviewProjects ?? []), ...creditedPreviewProjects]
    .filter((project, index, projects) =>
      projects.findIndex((candidate) => candidate.title === project.title) === index
    )
    .slice(0, 6);

  const isMember = await hasPaidMembership(user!.id);
  const isActorPrimary =
    profile.role_category === 'actor' ||
    (profile.role_titles?.[0] &&
      ['actor', 'lead actor', 'supporting actor', 'background actor', 'voice actor']
        .includes((profile.role_titles[0] as string).toLowerCase()));
  const isCrew =
    !isActorPrimary &&
    profile.role_category &&
    profile.role_category !== 'writer';
  const completeness = computeDashboardCompleteness(profile, linkedCreditCount ?? 0);
  const chapters = getChapterProgress(completeness);
  const publicStatus = getProfilePublicStatus(profile.visible, profile.approved);
  const primaryRole =
    profile.role_titles?.[0] || profile.role_category || 'Creative professional';
  const statusStyles = {
    Public: 'border-green-200 bg-green-50 text-green-900',
    Private: 'border-stone-200 bg-stone-50 text-stone-800',
    'Awaiting approval': 'border-amber-200 bg-amber-50 text-amber-900',
  }[publicStatus];

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      <BackLink href="/dashboard" label="Dashboard" />

      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="k-eyebrow mb-2">Your profile</p>
          <h1 className="k-section-title">Edit profile</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            Shape the professional presence collaborators see across Magiora.
          </p>
        </div>
        {profile.slug && (
          <Link
            href={`/m/${profile.slug}`}
            className="k-link whitespace-nowrap text-sm md:mt-2"
          >
            View public profile →
          </Link>
        )}
      </header>

      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <div>
          <ProfileChapterNavigation chapters={chapters} />
        </div>

        <div className="min-w-0">
          <ProfileMainForm
            key={params.toast === 'saved' ? 'profile-saved' : 'profile-editor'}
            action={updateProfile}
            error={params.error ?? null}
            isMember={isMember}
            currentSlug={profile.slug ?? ''}
            currentSkillCount={profile.skills?.length ?? 0}
          >
            <section
              id="profile-essentials"
              tabIndex={-1}
              className="scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
            >
              <ChapterHeader
                number="01"
                title="Profile essentials"
                description="The portrait, identity, location, and introduction that establish your professional presence."
              />

              <div id="photos" className="scroll-mt-24" data-auto-saved="true">
                <SectionLabel icon={SectionIcons.photo} label="Photos" />
                <p className="mb-5 font-serif text-xs italic text-stone-500">
                  Headshot and gallery — first impressions matter.
                </p>
                <ProfileMediaSection
                  userId={user!.id}
                  initialHeadshot={profile.headshot_url}
                  initialGallery={profile.gallery ?? []}
                  isMember={isMember}
                />
              </div>

              <section id="identity" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.identity} label="Identity" />
                <label htmlFor="display-name" className="mb-1 block text-sm font-medium">
                  Display name
                </label>
                <input
                  id="display-name"
                  type="text"
                  name="display_name"
                  defaultValue={profile.display_name ?? ''}
                  required
                  className="k-control"
                />
              </section>

              <section id="roles" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <RoleSection
                  defaultRoleTitles={profile.role_titles ?? []}
                  defaultPhysicalDetails={profile.physical_details ?? {}}
                  defaultGender={profile.gender}
                  defaultAgeMin={profile.age_range_min}
                  defaultAgeMax={profile.age_range_max}
                />
              </section>

              <section id="location" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.city} label="Location" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="profile-city" className="mb-1 block text-sm font-medium">City</label>
                    <input
                      id="profile-city"
                      type="text"
                      name="location_city"
                      defaultValue={profile.location_city ?? ''}
                      placeholder="Your city"
                      className="k-control"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">State</label>
                    <StateSelector defaultValue={profile.location_state ?? ''} />
                  </div>
                </div>
              </section>

              <section id="bio" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.bio} label="Bio" />
                <AutoGrowTextarea
                  name="bio"
                  defaultValue={profile.bio ?? ''}
                  placeholder="Tell people about your work, training, and what kind of projects you're drawn to..."
                  minRows={4}
                />
              </section>
            </section>

            <section
              id="professional-practice"
              tabIndex={-1}
              className="scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
            >
              <ChapterHeader
                number="02"
                title="Professional practice"
                description="Languages, skills, and practical capabilities that describe how you work."
              />

              <section id="languages" className="scroll-mt-24">
                <SectionLabel icon={SectionIcons.language} label="Languages" />
                <LanguageSelector defaultValue={profile.languages ?? []} />
              </section>

              <section id="skills" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel
                  icon={SectionIcons.skills}
                  label="Skills"
                />
                <SkillsAutocomplete
                  defaultValue={profile.skills ?? []}
                  maxAllowed={isMember ? undefined : FREE_SKILL_LIMIT}
                />
                <MemberEdition
                  title="Expanded skills"
                  benefit="Five professional skills are included. Member lets your full range of capabilities appear on your profile."
                  isMember={isMember}
                  className="mt-4"
                >
                  <p className="text-sm text-stone-600">
                    {isMember
                      ? `${profile.skills?.length ?? 0} skills currently shape your professional profile.`
                      : `${Math.min(profile.skills?.length ?? 0, FREE_SKILL_LIMIT)} of ${FREE_SKILL_LIMIT} included skills are currently used.`}
                  </p>
                </MemberEdition>
              </section>

              {isCrew ? (
                <section id="equipment" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                  <SectionLabel icon={SectionIcons.equipment} label="Equipment" />
                  <p className="mb-3 font-serif text-xs italic text-stone-500">
                    Professional equipment you can bring to a production.
                  </p>
                  <EquipmentEditor defaultValue={profile.equipment ?? []} />
                </section>
              ) : (
                <input
                  type="hidden"
                  name="equipment"
                  value={JSON.stringify(profile.equipment ?? [])}
                />
              )}
            </section>

            <section
              id="work"
              tabIndex={-1}
              className="scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
            >
              <ChapterHeader
                number="03"
                title="Professional Work"
                description="Projects, credits, demo reel and recommendations."
              />

              <section id="portfolio" className="scroll-mt-24">
                <SectionLabel icon={SectionIcons.demoReel} label="Demo reel & videos" />
                <VideoLinksManager
                  initialDemoReel={profile.demo_reel_url}
                  initialLinks={profile.video_links ?? []}
                  isMember={isMember}
                />
                <p className="mt-2 font-serif text-xs italic text-stone-500">
                  Tip: YouTube and Vimeo links are embedded directly on your public profile.
                </p>
              </section>

              <section id="experience" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.experience} label="Experience" />
                <p className="mb-3 font-serif text-xs italic text-stone-500">
                  Auto-sorted by year (newest first), no matter the order you enter.
                </p>
                <ExperienceEditor defaultValue={profile.experience ?? []} />
              </section>

              <section id="recommendations" className="mt-8 scroll-mt-24 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.recommendations} label="Recommendations" />
                <RecommendationsEditor defaultValue={profile.recommendations ?? []} />
              </section>
            </section>

            <section
              id="contact-chapter"
              tabIndex={-1}
              className="scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
            >
              <ChapterHeader
                number="04"
                title="Contact"
                description="Professional contact details, representation, and the links collaborators can follow."
              />
              <section id="contact" className="scroll-mt-24">
                <SectionLabel icon={SectionIcons.contact} label="Contact & representation" />
                <ContactEditor
                  defaultContactEmail={profile.contact_email ?? ''}
                  defaultPhone={profile.phone ?? ''}
                  defaultWebsiteUrl={profile.website_url ?? ''}
                  defaultSocial={profile.social_links ?? {}}
                  defaultRep={profile.representation ?? {}}
                />
              </section>
            </section>

            <section
              id="public-presence"
              tabIndex={-1}
              className="scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
            >
              <ChapterHeader
                number="05"
                title="Public presence"
                description="Control whether your profile can be discovered and how it appears publicly."
              />

              <div className={`rounded-md border p-4 ${statusStyles}`} role="status">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="k-eyebrow mb-1 text-current">Profile status</p>
                    <h3 className="font-serif text-xl font-medium">{publicStatus}</h3>
                    <p className="mt-1 max-w-lg text-sm">
                      {publicStatus === 'Public' &&
                        'Your approved profile is visible in the directory and can receive casting matches.'}
                      {publicStatus === 'Private' &&
                        'Your approved profile is hidden from the directory until you make it public.'}
                      {publicStatus === 'Awaiting approval' &&
                        'Your profile will become publicly discoverable after editorial approval.'}
                    </p>
                  </div>
                  {profile.slug && (
                    <Link
                      href={`/m/${profile.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View public profile preview (opens in a new tab)"
                      className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-current/50 underline-offset-4 transition-colors hover:text-[#712B13] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#712B13]"
                    >
                      View preview
                      <span aria-hidden="true">{SectionIcons.externalLink}</span>
                    </Link>
                  )}
                </div>
              </div>

              <section className="mt-8 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.premium} label="Profile presentation" />

                <div className="space-y-5">
                  <MemberEdition
                    title="Custom profile URL"
                    benefit="Choose a memorable Magiora link that is easy to share with collaborators."
                    isMember={isMember}
                  >
                    <SlugEditor currentSlug={profile.slug} isMember={isMember} />
                  </MemberEdition>
                  <ThemeSelector
                    defaultTemplate={profile.profile_theme}
                    defaultAccent={profile.profile_accent}
                    isMember={isMember}
                    initialData={{
                      headshotUrl: profile.headshot_url,
                      displayName: profile.display_name ?? '',
                      roles: profile.role_titles ?? [primaryRole],
                      city: profile.location_city ?? '',
                      state: profile.location_state ?? '',
                      bio: profile.bio ?? '',
                      languages: profile.languages ?? [],
                      skills: profile.skills ?? [],
                      demoReelUrl: profile.demo_reel_url ?? '',
                      gallery: profile.gallery ?? [],
                      experience: profile.experience ?? [],
                      projects: previewProjects,
                      recommendations: profile.recommendations ?? [],
                      socialLinks: profile.social_links ?? {},
                    }}
                  />
                </div>
              </section>

              <section className="mt-8 border-t border-stone-200 pt-6">
                <SectionLabel icon={SectionIcons.visibility} label="Visibility" />
                <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-sm font-serif text-xs italic text-stone-500">
                    Public profiles appear in the directory and receive casting call matches.
                  </p>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      name="visible"
                      defaultChecked={profile.visible}
                      value="true"
                      className="h-4 w-4 cursor-pointer accent-[#712B13]"
                    />
                    <span className="text-sm font-medium">Public</span>
                  </label>
                </div>
              </section>
            </section>
          </ProfileMainForm>

          <section
            id="trust-account"
            tabIndex={-1}
            className="mt-10 scroll-mt-24 rounded-md border border-stone-200 bg-white p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#712B13] sm:p-7"
          >
            <ChapterHeader
              number="06"
              title="Trust & account"
              description="Verification and account security live here, separate from your public profile content."
            />

            <section>
              <SectionLabel icon={SectionIcons.verified} label="Verification" />
              <p className="mb-4 max-w-2xl text-sm leading-relaxed text-stone-600">
                Verification confirms identity and professional authenticity. It is reviewed separately from Magiora membership and does not require a paid plan.
              </p>
              <VerifiedRequestForm
                userId={user!.id}
                verified={profile.verified}
                verificationStatus={profile.verification_status ?? 'not_requested'}
                verificationData={profile.verification_data ?? {}}
                onSubmit={requestVerified}
              />
            </section>

            <form
              id="password-form"
              action={changePassword}
              className="mt-10 space-y-4 border-t border-stone-200 pt-8"
            >
              <div>
                <p className="mb-2 font-serif text-sm italic text-[#993C1D]">Security</p>
                <h3 className="font-serif text-xl font-medium">Change password</h3>
              </div>
              <div className="grid max-w-lg grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-sm font-medium">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    name="new_password"
                    required
                    minLength={6}
                    className="k-control"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">Confirm</label>
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirm_password"
                    required
                    minLength={6}
                    className="k-control"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="k-button w-full bg-stone-800 text-white hover:bg-stone-900 md:w-auto"
              >
                Update password
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
