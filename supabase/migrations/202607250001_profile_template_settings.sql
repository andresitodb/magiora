-- Persistent per-template profile presentation settings.
-- Rollback: drop policies, then drop this table. Legacy profile fields remain.

create table if not exists public.profile_template_settings (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  template_id text not null,
  palette_id text not null,
  font_style text not null default 'editorial',
  section_order jsonb not null default '["about","gallery","reel","work","credits","practice","recommendations","contact"]'::jsonb,
  hidden_sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_template_settings_profile_template_key unique (profile_id, template_id),
  constraint profile_template_settings_template_check check (template_id in ('editorial','cinematic','portrait','minimalist','stage','studio')),
  constraint profile_template_settings_palette_check check (palette_id in ('coral','monochrome','forest','ocean','sunset','midnight')),
  constraint profile_template_settings_font_check check (font_style in ('editorial','modern','classic','contemporary')),
  constraint profile_template_settings_section_order_array check (
    jsonb_typeof(section_order) = 'array'
    and section_order <@ '["about","gallery","reel","work","credits","practice","recommendations","contact"]'::jsonb
    and jsonb_array_length(section_order) <= 8
  ),
  constraint profile_template_settings_hidden_sections_array check (
    jsonb_typeof(hidden_sections) = 'array'
    and hidden_sections <@ '["about","gallery","reel","work","credits","practice","recommendations","contact"]'::jsonb
    and jsonb_array_length(hidden_sections) <= 8
  )
);

create index if not exists profile_template_settings_profile_id_idx
  on public.profile_template_settings(profile_id);

alter table public.profile_template_settings enable row level security;

drop policy if exists "Owners can read template settings" on public.profile_template_settings;
create policy "Owners can read template settings" on public.profile_template_settings
  for select using (auth.uid() = profile_id);

drop policy if exists "Public can read published template settings" on public.profile_template_settings;
create policy "Public can read published template settings" on public.profile_template_settings
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_template_settings.profile_id
        and profiles.visible = true
        and profiles.approved = true
    )
  );

drop policy if exists "Owners can insert template settings" on public.profile_template_settings;
create policy "Owners can insert template settings" on public.profile_template_settings
  for insert with check (auth.uid() = profile_id);

drop policy if exists "Owners can update template settings" on public.profile_template_settings;
create policy "Owners can update template settings" on public.profile_template_settings
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "Admins can manage template settings" on public.profile_template_settings;
create policy "Admins can manage template settings" on public.profile_template_settings
  for all using (public.is_admin_user()) with check (public.is_admin_user());

insert into public.profile_template_settings (profile_id, template_id, palette_id)
select id, profile_theme, profile_accent
from public.profiles
where profile_theme in ('editorial','cinematic','portrait','minimalist','stage','studio')
  and profile_accent in ('coral','monochrome','forest','ocean','sunset','midnight')
on conflict (profile_id, template_id) do nothing;
