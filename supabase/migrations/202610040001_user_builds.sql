begin;
create table public.user_builds (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 160),
 champion text not null,items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=6),
 runes jsonb not null,slider jsonb not null,matchup jsonb not null,
 scenario jsonb not null check(pg_column_size(scenario)<=100000),
 created_at timestamptz not null default now()
);
create index user_builds_owner_date on public.user_builds(owner_id,created_at desc);
alter table public.user_builds enable row level security;
revoke all on public.user_builds from anon,authenticated;
grant select,insert,delete on public.user_builds to authenticated;
create policy builds_select on public.user_builds for select to authenticated using(owner_id=(select auth.uid()));
create policy builds_insert on public.user_builds for insert to authenticated with check(owner_id=(select auth.uid()));
create policy builds_delete on public.user_builds for delete to authenticated using(owner_id=(select auth.uid()));
create function public.enforce_build_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare premium boolean;
begin
 if auth.uid() is null or new.owner_id<>auth.uid() then raise exception 'Forbidden';end if;
 -- Serialize saves for this account: concurrent inserts cannot both take the final free slot.
 perform 1 from public.accounts where id=new.owner_id for update;
 if not found then raise exception 'Account missing';end if;
 select coalesce((public.my_entitlement()->>'pro')::boolean,false) into premium;
 if not premium and (select count(*) from public.user_builds where owner_id=new.owner_id)>=3 then
  raise exception 'FREE_PRESET_LIMIT' using errcode='P0001';
 end if;
 return new;
end;$$;
revoke execute on function public.enforce_build_limit() from public,anon,authenticated;
create trigger enforce_build_limit before insert on public.user_builds for each row execute function public.enforce_build_limit();
commit;
