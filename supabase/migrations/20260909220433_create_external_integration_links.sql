create table if not exists public.external_integration_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_request_id text not null,
  external_demand_id text,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_integration_links_provider_check check (length(trim(provider)) > 0),
  constraint external_integration_links_request_check check (length(trim(external_request_id)) > 0),
  constraint external_integration_links_entity_type_check check (entity_type in ('fazenda','equipamento','visita','checklist','evidencia')),
  constraint external_integration_links_status_check check (status in ('pending','processing','completed','failed','cancelled'))
);

alter table public.external_integration_links enable row level security;

grant select on table public.external_integration_links to authenticated;
grant select, insert, update, delete on table public.external_integration_links to service_role;

drop policy if exists "external integration links read related farms" on public.external_integration_links;
create policy "external integration links read related farms"
on public.external_integration_links
for select
to authenticated
using (
  public.is_app_admin()
  or (
    entity_type = 'fazenda'
    and public.can_view_fazenda(entity_id)
  )
);

create unique index if not exists external_integration_links_provider_request_uidx
  on public.external_integration_links(provider, external_request_id);

create index if not exists external_integration_links_provider_demand_idx
  on public.external_integration_links(provider, external_demand_id)
  where external_demand_id is not null;

create index if not exists external_integration_links_entity_idx
  on public.external_integration_links(entity_type, entity_id);
