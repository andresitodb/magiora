do $$
begin
  if to_regprocedure('public.is_admin_user()') is null then
    raise exception 'Required helper public.is_admin_user() does not exist';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'UPDATE'
      and (
        coalesce(qual, '') ilike '%is_admin_user%'
        or coalesce(with_check, '') ilike '%is_admin_user%'
      )
  ) then
    execute $policy$
      create policy "Admins can update profiles"
      on public.profiles
      for update
      to authenticated
      using (public.is_admin_user())
      with check (public.is_admin_user())
    $policy$;
  end if;
end
$$;
