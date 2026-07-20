import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { postCastingCall } from '../actions';

export default async function NewCastingCallPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; matches?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single();

  if (profile?.plan !== 'member') {
    redirect('/dashboard?error=members_only');
  }

  return (
    <div className="max-w-2xl">
      <p className="font-serif italic text-sm text-[#993C1D] mb-2">For producers</p>
      <h1 className="font-serif text-3xl font-medium mb-2">Post a casting call</h1>
      <p className="text-sm text-stone-600 italic font-serif mb-8">
        Reviewed by the Magiora editorial team within 24 hours. Members matching
        your targeting will be notified when it goes live.
      </p>

      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3 mb-6">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={postCastingCall} className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium border-b border-stone-200 pb-2">
            The project
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">Project title</label>
            <input
              type="text"
              name="project_title"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="project_type"
                defaultValue="short_film"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="short_film">Short film</option>
                <option value="feature_film">Feature film</option>
                <option value="pilot_series">Pilot / series</option>
                <option value="music_video">Music video</option>
                <option value="commercial">Commercial</option>
                <option value="documentary">Documentary</option>
                <option value="web_series">Web series</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="project_status"
                defaultValue="pre_production"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="pre_production">Pre-production</option>
                <option value="in_production">In production</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brief description</label>
            <textarea
              name="project_description"
              rows={3}
              required
              placeholder="A short paragraph about the project..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium border-b border-stone-200 pb-2">
            The role
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role name</label>
              <input
                type="text"
                name="role_name"
                required
                placeholder="Carmen"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role size</label>
              <select
                name="role_size"
                defaultValue="lead"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="lead">Lead</option>
                <option value="supporting">Supporting</option>
                <option value="featured">Featured</option>
                <option value="day_player">Day player</option>
                <option value="background">Background</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              About the character
            </label>
            <textarea
              name="role_description"
              rows={3}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium border-b border-stone-200 pb-2">
            Logistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shoot start</label>
              <input
                type="date"
                name="shoot_start_date"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shoot end</label>
              <input
                type="date"
                name="shoot_end_date"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location_city"
                placeholder="Miami, FL"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Union</label>
              <select
                name="union_status"
                defaultValue="sag_friendly"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="sag_friendly">SAG-friendly</option>
                <option value="sag_only">SAG only</option>
                <option value="non_union">Non-union</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Compensation</label>
            <input
              type="text"
              name="compensation"
              placeholder="Day rate + meals + IMDB credit"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
            <p className="text-xs text-stone-500 italic font-serif mt-1">
              Be specific. "Negotiable" and "TBD" turn applicants away.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium border-b border-stone-200 pb-2">
            Who you're looking for
          </h2>
          <p className="text-xs text-stone-500 italic font-serif">
            These fields power the matching engine.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role category</label>
              <select
                name="target_role_category"
                defaultValue="actor"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="actor">Actor</option>
                <option value="cinematographer">Cinematographer</option>
                <option value="editor">Editor</option>
                <option value="sound">Sound designer</option>
                <option value="writer">Writer</option>
                <option value="production_designer">Production designer</option>
                <option value="makeup_hair">Makeup &amp; hair</option>
                <option value="costume">Costume</option>
                <option value="crew_other">Other crew</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                name="target_gender"
                defaultValue="Any"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value="Any">Any</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age min</label>
              <input
                type="number"
                name="target_age_min"
                min="0"
                max="120"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age max</label>
              <input
                type="number"
                name="target_age_max"
                min="0"
                max="120"
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Languages required
              <span className="text-xs text-stone-500 ml-2 italic font-serif font-normal">
                comma-separated
              </span>
            </label>
            <input
              type="text"
              name="target_languages"
              placeholder="Spanish, English"
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-medium border-b border-stone-200 pb-2">
            How to apply
          </h2>
          <p className="text-xs text-stone-500 italic font-serif">
            Member profile auto-attaches. Add anything extra below.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              Additional requirements
            </label>
            <textarea
              name="additional_requirements"
              rows={3}
              placeholder="Self-tape sides, paragraph on the material, availability confirmation..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white font-serif"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Application deadline
            </label>
            <input
              type="date"
              name="application_deadline"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
            />
          </div>
        </section>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            name="submit_action"
            value="draft"
            className="bg-stone-700 text-white py-2 px-6 rounded-md font-medium hover:bg-stone-800"
          >
            Save as draft
          </button>
          <button
            type="submit"
            name="submit_action"
            value="submit"
            className="bg-[#712B13] text-white py-2 px-6 rounded-md font-medium hover:bg-[#4A1B0C]"
          >
            Submit for review
          </button>
        </div>
      </form>
    </div>
  );
}
