-- V3.10: retorno de visitas e resolução de pendências sem perder histórico
alter table public.visitas
add column if not exists parent_visit_id uuid references public.visitas(id) on delete set null,
add column if not exists resolved_by_visit_id uuid references public.visitas(id) on delete set null,
add column if not exists resolved_at timestamptz,
add column if not exists retorno_necessario boolean not null default false;

create index if not exists visitas_parent_visit_idx on public.visitas(parent_visit_id);
create index if not exists visitas_resolved_by_visit_idx on public.visitas(resolved_by_visit_id);
create index if not exists visitas_retorno_necessario_idx on public.visitas(fazenda_id, retorno_necessario);
