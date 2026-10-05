begin;
create or replace function public.apply_billing_event(p_provider text,p_event_id text,p_hash text,p_user uuid,p_external text,p_status text,p_until timestamptz) returns void language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(hashtext(p_provider||':'||p_external));
 if exists(select 1 from public.webhook_events where provider=p_provider and event_id=p_event_id and processed_at is not null) then return;end if;
 insert into public.webhook_events(provider,event_id,payload_hash) values(p_provider,p_event_id,p_hash) on conflict do nothing;
 insert into public.subscriptions(user_id,provider,external_id,status,period_end) values(p_user,p_provider,p_external,p_status,p_until) on conflict(provider,external_id) do update set status=excluded.status,period_end=excluded.period_end,event_at=now();
 update public.accounts set pro_until=(select max(period_end) from public.subscriptions where user_id=p_user and status in ('active','trialing') and period_end>now()) where id=p_user;
 update public.webhook_events set processed_at=now() where provider=p_provider and event_id=p_event_id;
 insert into public.audit_log(actor,event,detail) values(p_user,'billing_reconciled',jsonb_build_object('provider',p_provider,'status',p_status));
end;$$;
revoke all on function public.apply_billing_event(text,text,text,uuid,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_billing_event(text,text,text,uuid,text,text,timestamptz) to service_role;
commit;
