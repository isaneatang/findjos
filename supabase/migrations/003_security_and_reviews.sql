-- Security correction and review workflow for projects created with earlier schema versions.
drop policy if exists "Users update their profile" on public.profiles;

create or replace function public.apply_listing_edit(edit_id uuid, decision public.claim_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  edit_row public.listing_edits;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;

  select * into edit_row from public.listing_edits where id = edit_id for update;
  if edit_row.id is null then raise exception 'Edit not found'; end if;

  update public.listing_edits
  set status = decision, reviewed_by = auth.uid(), reviewed_at = now()
  where id = edit_id;

  if decision = 'approved' then
    update public.businesses
    set name = coalesce(edit_row.changes ->> 'name', name),
        description = coalesce(edit_row.changes ->> 'description', description),
        phone = coalesce(edit_row.changes ->> 'phone', phone),
        whatsapp = coalesce(edit_row.changes ->> 'whatsapp', whatsapp),
        address = coalesce(edit_row.changes ->> 'address', address),
        landmark = coalesce(edit_row.changes ->> 'landmark', landmark),
        area = coalesce(edit_row.changes ->> 'area', area),
        updated_at = now()
    where id = edit_row.business_id;
  end if;
end;
$$;

create or replace function public.review_business_claim(claim_id uuid, decision public.claim_status)
returns void language plpgsql security definer set search_path = public as $$
declare
  claim_row public.claims;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required';
  end if;
  select * into claim_row from public.claims where id = claim_id for update;
  if claim_row.id is null then raise exception 'Claim not found'; end if;
  update public.claims set status = decision, reviewed_by = auth.uid(), reviewed_at = now() where id = claim_id;
  if decision = 'approved' then
    update public.businesses set owner_id = claim_row.claimant_id, updated_at = now() where id = claim_row.business_id;
  end if;
end;
$$;
