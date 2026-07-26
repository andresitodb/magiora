-- Additive settings for the multi-page Cinematic Showcase template.
-- Safe to run after 202607250001_profile_template_settings.sql.

alter table public.profile_template_settings
  add column if not exists navigation_order jsonb;

alter table public.profile_template_settings
  add column if not exists home_section_order jsonb;

alter table public.profile_template_settings
  add column if not exists reading_scale text;

update public.profile_template_settings
set navigation_order = '["home","about","portfolio","reel","credits","gallery","equipment","contact"]'::jsonb
where navigation_order is null;

update public.profile_template_settings
set home_section_order = '["introduction","featured_work","gallery_preview","selected_credits","contact_cta"]'::jsonb
where home_section_order is null;

update public.profile_template_settings
set reading_scale = 'medium'
where reading_scale is null;

alter table public.profile_template_settings
  alter column navigation_order
    set default '["home","about","portfolio","reel","credits","gallery","equipment","contact"]'::jsonb,
  alter column navigation_order set not null,
  alter column home_section_order
    set default '["introduction","featured_work","gallery_preview","selected_credits","contact_cta"]'::jsonb,
  alter column home_section_order set not null,
  alter column reading_scale set default 'medium',
  alter column reading_scale set not null;

alter table public.profile_template_settings
  drop constraint if exists profile_template_settings_palette_check;

alter table public.profile_template_settings
  add constraint profile_template_settings_palette_check check (
    palette_id in (
      'coral', 'monochrome', 'forest', 'ocean', 'sunset', 'midnight',
      'noir', 'silver-screen', 'deep-burgundy', 'midnight-blue'
    )
  );

alter table public.profile_template_settings
  drop constraint if exists profile_template_settings_font_check;

alter table public.profile_template_settings
  add constraint profile_template_settings_font_check check (
    font_style in (
      'editorial', 'modern', 'classic', 'contemporary',
      'auteur', 'premiere', 'modern-cinema', 'festival'
    )
  );

alter table public.profile_template_settings
  drop constraint if exists profile_template_settings_navigation_order_array;

alter table public.profile_template_settings
  add constraint profile_template_settings_navigation_order_array check (
    jsonb_typeof(navigation_order) = 'array'
    and jsonb_array_length(navigation_order) = 8
    and navigation_order <@ '["home","about","portfolio","reel","credits","gallery","equipment","contact"]'::jsonb
    and navigation_order @> '["home","about","portfolio","reel","credits","gallery","equipment","contact"]'::jsonb
  );

alter table public.profile_template_settings
  drop constraint if exists profile_template_settings_reading_scale_check;

alter table public.profile_template_settings
  add constraint profile_template_settings_reading_scale_check check (
    reading_scale in ('small', 'medium', 'large')
  );

alter table public.profile_template_settings
  drop constraint if exists profile_template_settings_home_section_order_array;

alter table public.profile_template_settings
  add constraint profile_template_settings_home_section_order_array check (
    jsonb_typeof(home_section_order) = 'array'
    and jsonb_array_length(home_section_order) = 5
    and home_section_order <@ '["featured_work","introduction","gallery_preview","selected_credits","contact_cta"]'::jsonb
    and home_section_order @> '["featured_work","introduction","gallery_preview","selected_credits","contact_cta"]'::jsonb
  );
