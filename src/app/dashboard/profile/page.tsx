import { createClient } from '@/lib/supabase/server';
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
import { SectionIcons } from '@/components/SectionIcons';
import { Suspense } from 'react';
import Link from 'next/link';
import { hasPaidMembership } from '@/lib/billingServer';

const FREE_SKILL_LIMIT = 5;
const FREE_GALLERY_LIMIT = 3;

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[#993C1D]">{icon}</span>
      <p className="font-serif italic text-sm text-[#993C1D]">{label}</p>
    </div>
  );
}

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  if (!profile) return null;

  const isMember = await hasPaidMembership(user!.id);
  const isActorPrimary =
    profile.role_category === 'actor' ||
    (profile.role_titles?.[0] && ['actor', 'lead actor', 'supporting actor', 'background actor', 'voice actor'].includes((profile.role_titles[0] as string).toLowerCase()));
  const isCrew = !isActorPrimary && profile.role_category && profile.role_category !== 'writer';

  return (
    <div className="max-w-2xl pb-12">
      <Suspense fallback={null}>
        <Toast />
      </Suspense>

      <BackLink href="/dashboard" label="Dashboard" />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-3">
        <div>
          <p className="k-eyebrow mb-2">Your profile</p>
          <h1 className="k-section-title">Edit profile</h1>
        </div>
        {profile.slug && (
          <Link
            href={`/m/${profile.slug}`}
            className="text-sm text-[#712B13] italic font-serif hover:underline md:mt-2 whitespace-nowrap"
          >
            View public profile →
          </Link>
        )}
      </div>

      {/* PHOTOS — with icon header */}
      <div className="mb-3">
        <SectionLabel icon={SectionIcons.photo} label="Photos" />
        <p className="text-xs text-stone-500 italic font-serif">
          Headshot and gallery — first impressions matter.
        </p>
      </div>
      <ProfileMediaSection
        userId={user!.id}
        initialHeadshot={profile.headshot_url}
        initialGallery={profile.gallery ?? []}
      />
      {!isMember && (profile.gallery?.length ?? 0) >= FREE_GALLERY_LIMIT && (
        <p className="text-xs italic text-[#993C1D] font-serif mt-2">
          🔒 Free plan shows the first {FREE_GALLERY_LIMIT} gallery photos publicly.{' '}
          <Link href="/pricing" className="underline">Upgrade for unlimited →</Link>
        </p>
      )}

      <form action={updateProfile} className="space-y-8 mt-12" id="profile-form">
        {/* IDENTITY */}
        <section className="space-y-4">
          <SectionLabel icon={SectionIcons.identity} label="Identity" />
          <div>
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input
              type="text"
              name="display_name"
              defaultValue={profile.display_name ?? ''}
              required
              className="k-control"
            />
          </div>
        </section>

        {/* ROLES */}
        <section className="space-y-4 pt-6 border-t border-stone-200">
          <RoleSection
            defaultRoleTitles={profile.role_titles ?? []}
            defaultPhysicalDetails={profile.physical_details ?? {}}
            defaultGender={profile.gender}
            defaultAgeMin={profile.age_range_min}
            defaultAgeMax={profile.age_range_max}
          />
        </section>

        {/* DEMO REEL */}
        <section className="space-y-4 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.demoReel} label="Demo reel & videos" />
          {isMember ? (
            <>
              <VideoLinksManager
                initialDemoReel={profile.demo_reel_url}
                initialLinks={profile.video_links ?? []}
              />
              <p className="text-xs italic text-stone-500 font-serif">
                Tip: YouTube and Vimeo links are embedded directly on your public profile.
              </p>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Demo reel</label>
              <input
                type="url"
                name="demo_reel_url"
                defaultValue={profile.demo_reel_url ?? ''}
                placeholder="https://vimeo.com/yourreel"
                className="k-control"
              />
              <p className="text-xs italic text-stone-500 font-serif mt-1">
                YouTube and Vimeo links are embedded on your public profile.
              </p>
              <input type="hidden" name="video_links" value="[]" />
              <p className="mt-3 text-xs italic text-[#993C1D] font-serif">
                🔒 Members can add up to 4 additional videos with custom labels.{' '}
                <Link href="/pricing" className="underline">Upgrade →</Link>
              </p>
            </div>
          )}
        </section>

        {/* BIO */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.bio} label="Bio" />
          <AutoGrowTextarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            placeholder="Tell people about your work, training, and what kind of projects you're drawn to..."
            minRows={4}
          />
        </section>

        {/* CONTACT */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.contact} label="Contact & representation" />
          <ContactEditor
            defaultContactEmail={profile.contact_email ?? ''}
            defaultPhone={profile.phone ?? ''}
            defaultWebsiteUrl={profile.website_url ?? ''}
            defaultSocial={profile.social_links ?? {}}
            defaultRep={profile.representation ?? {}}
          />
        </section>

        {/* CITY */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.city} label="Location" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                name="location_city"
                defaultValue={profile.location_city ?? ''}
                placeholder="Your city"
                className="k-control"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <StateSelector defaultValue={profile.location_state ?? ''} />
            </div>
          </div>
        </section>

        {/* LANGUAGES */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.language} label="Languages" />
          <LanguageSelector defaultValue={profile.languages ?? []} />
        </section>

        {/* SKILLS */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel
            icon={SectionIcons.skills}
            label={`Skills${!isMember ? ` — free plan limit ${FREE_SKILL_LIMIT}` : ''}`}
          />
          <SkillsAutocomplete
            defaultValue={profile.skills ?? []}
            maxAllowed={isMember ? undefined : FREE_SKILL_LIMIT}
          />
        </section>

        {/* EXPERIENCE */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.experience} label="Experience" />
          <p className="text-xs italic text-stone-500 font-serif">
            Auto-sorted by year (newest first), no matter the order you enter.
          </p>
          <ExperienceEditor defaultValue={profile.experience ?? []} />
        </section>

        {/* RECOMMENDATIONS */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.recommendations} label="Recommendations" />
          <RecommendationsEditor defaultValue={profile.recommendations ?? []} />
        </section>

        {/* EQUIPMENT */}
        {isCrew && (
          <section className="space-y-3 pt-6 border-t border-stone-200">
            <SectionLabel icon={SectionIcons.equipment} label="Equipment you own" />
            <p className="text-xs italic text-stone-500 font-serif">
              Cameras, lights, sound gear — anything you can bring to a production.
            </p>
            <EquipmentEditor defaultValue={profile.equipment ?? []} />
          </section>
        )}
        {!isCrew && (
          <input
            type="hidden"
            name="equipment"
            value={JSON.stringify(profile.equipment ?? [])}
          />
        )}

        {/* PREMIUM */}
        <section className="space-y-4 pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.premium} label="Premium customization" />

          {!isMember && (
            <div className="bg-[#FAEEDA] border border-[#FAC775] rounded-md p-4 text-sm">
              <p className="font-serif italic text-[#993C1D] mb-1">🔒 Members only</p>
              <p className="font-serif text-stone-700">
                Get a custom URL like <strong className="font-mono not-italic">yourname.magiora.com</strong> and choose a template &amp; color palette for your profile.
              </p>
              <Link
                href="/pricing"
                className="inline-block mt-2 text-[#712B13] hover:underline font-medium"
              >
                See member benefits →
              </Link>
            </div>
          )}

          <div className={!isMember ? 'opacity-50 pointer-events-none select-none' : ''}>
            <div className="mb-6">
              <SlugEditor currentSlug={profile.slug} isMember={isMember} />
            </div>
            <ThemeSelector
              defaultTemplate={profile.profile_theme}
              defaultAccent={profile.profile_accent}
              isMember={isMember}
            />
          </div>
        </section>

        {/* VISIBILITY */}
        <section className="pt-6 border-t border-stone-200">
          <SectionLabel icon={SectionIcons.visibility} label="Visibility" />
          <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between gap-3">
            <p className="text-xs text-stone-500 italic font-serif max-w-xs">
              Public profiles appear in the directory and receive casting call matches.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="visible"
                defaultChecked={profile.visible}
                value="true"
                className="w-4 h-4 cursor-pointer accent-[#712B13]"
              />
              <span className="text-sm font-medium">Public</span>
            </label>
          </div>
        </section>

        <div className="pt-6 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            className="k-button k-button-primary w-full md:w-auto"
          >
            Save changes
          </button>
        </div>
      </form>

      {/* VERIFIED REQUEST — outside the main form (uses its own server action) */}
      <section className="mt-12 pt-8 border-t border-stone-200 space-y-3">
        <SectionLabel icon={SectionIcons.verified} label="Verification" />
        <VerifiedRequestForm
          userId={user!.id}
          verified={profile.verified}
          verificationStatus={profile.verification_status ?? 'not_requested'}
          verificationData={profile.verification_data ?? {}}
          onSubmit={requestVerified}
        />
      </section>

      <form action={changePassword} className="space-y-4 mt-16 pt-12 border-t border-stone-200">
        <div>
          <p className="font-serif italic text-sm text-[#993C1D] mb-2">Security</p>
          <h2 className="font-serif text-2xl font-medium">Change password</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              name="new_password"
              required
              minLength={6}
              className="k-control"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm</label>
            <input
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
          className="k-button bg-stone-800 text-white hover:bg-stone-900 w-full md:w-auto"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
