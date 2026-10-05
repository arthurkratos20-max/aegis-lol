begin;
-- accounts is the existing profile table. user_builds stores presets, not plans.
alter table public.accounts add column plan text not null default 'free' check (plan in ('free','pro'));
alter table public.accounts add column plan_expires_at timestamptz;
alter table public.accounts add column billing_cycle text check (billing_cycle in ('monthly','annual'));
-- Only the server/service role can change plans. Existing RLS grants SELECT only.
create or replace function public.my_entitlement() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare a public.accounts; permanent_owner boolean; premium boolean; expires timestamptz;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into a from public.accounts where id=auth.uid();
 select exists(select 1 from auth.users where id=auth.uid()
  and lower(email)='arthurkratos20@gmail.com' and email_confirmed_at is not null) into permanent_owner;
 premium := permanent_owner or coalesce(a.role in ('owner','admin'),false)
  or coalesce(a.plan='pro' and (a.plan_expires_at is null or a.plan_expires_at>now()),false)
  or coalesce(a.pro_until>now(),false) or coalesce(a.trial_end>now(),false);
 if not (permanent_owner or coalesce(a.role in ('owner','admin'),false)
  or coalesce(a.plan='pro' and a.plan_expires_at is null,false)) then
  expires := greatest(case when a.plan='pro' then a.plan_expires_at end,a.pro_until,a.trial_end);
 end if;
 return jsonb_build_object('role',case when permanent_owner then 'owner' else coalesce(a.role,'user') end,
  'plan',case when premium then 'pro' else 'free' end,'pro',premium,
  'plan_expires_at',expires,'billing_cycle',a.billing_cycle,'trial_end',a.trial_end,'pro_until',a.pro_until);
end;$$;
-- Native lifetime access for an already verified owner, without a subscription expiry.
update public.accounts set role='owner',plan='pro',plan_expires_at=null,billing_cycle=null
 where id in (select id from auth.users where lower(email)='arthurkratos20@gmail.com' and email_confirmed_at is not null);
-- Newly confirmed owner accounts receive lifetime access through my_entitlement too.
create or replace function public.require_admin() returns void language plpgsql stable security definer set search_path='' as $$
begin if auth.uid() is null or public.my_entitlement()->>'role' not in ('owner','admin') then raise exception 'Forbidden';end if;end;$$;
-- Realtime account updates refresh the React context immediately when available.
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
  and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='accounts') then
  alter publication supabase_realtime add table public.accounts;
 end if;
end;$$;
commit;
