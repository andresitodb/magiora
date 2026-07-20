alter table public.interviews
add column if not exists featured_at timestamptz null;

create index if not exists interviews_featured_at_idx
on public.interviews (featured_at desc)
where featured_at is not null;

do $$
begin
  if to_regprocedure('public.is_admin_user()') is null then
    raise exception 'Required helper public.is_admin_user() does not exist';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'interviews'
      and cmd = 'UPDATE'
      and (
        coalesce(qual, '') ilike '%is_admin_user%'
        or coalesce(with_check, '') ilike '%is_admin_user%'
      )
  ) then
    execute $policy$
      create policy "Admins can update interviews"
      on public.interviews
      for update
      to authenticated
      using (public.is_admin_user())
      with check (public.is_admin_user())
    $policy$;
  end if;
end
$$;
