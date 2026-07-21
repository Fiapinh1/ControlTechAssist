create extension if not exists pgcrypto;

create table if not exists public.fazendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  central text,
  regional_nome text,
  veterinario_apoio text,
  responsavel text,
  telefone text,
  estado_uf text,
  estado_nome text,
  cidade text,
  codigo_ibge_cidade text,
  latitude numeric,
  longitude numeric,
  localizacao_origem text,
  endereco text,
  qtd_colares_prevista integer default 0,
  qtd_colares_instalada integer default 0,
  servico_inicio_em timestamptz,
  servico_fim_em timestamptz,
  servico_responsavel text,
  servico_observacoes text,
  status text default 'Não iniciada',
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  fazenda_id uuid references public.fazendas(id) on delete cascade,
  tipo text,
  codigo_original text,
  apelido text,
  local_nome text,
  latitude numeric,
  longitude numeric,
  status text default 'Planejado',
  instalado_em date,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  fazenda_id uuid references public.fazendas(id) on delete cascade,
  tipo text,
  data_visita date default current_date,
  resumo text,
  problemas text,
  solucao text,
  pendencias text,
  proxima_acao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.checklists_fazenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  fazenda_id uuid references public.fazendas(id) on delete cascade,
  tipo text,
  titulo text,
  itens_json jsonb default '[]'::jsonb,
  status text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.diagnosticos_realizados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  fazenda_id uuid references public.fazendas(id) on delete set null,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  categoria text,
  sintoma text,
  resultado text,
  acoes_realizadas text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fazendas enable row level security;
alter table public.equipamentos enable row level security;
alter table public.visitas enable row level security;
alter table public.checklists_fazenda enable row level security;
alter table public.diagnosticos_realizados enable row level security;

drop policy if exists "fazendas_select_own" on public.fazendas;
drop policy if exists "fazendas_insert_own" on public.fazendas;
drop policy if exists "fazendas_update_own" on public.fazendas;
drop policy if exists "fazendas_delete_own" on public.fazendas;
create policy "fazendas_select_own" on public.fazendas for select using (auth.uid() = user_id);
create policy "fazendas_insert_own" on public.fazendas for insert with check (auth.uid() = user_id);
create policy "fazendas_update_own" on public.fazendas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fazendas_delete_own" on public.fazendas for delete using (auth.uid() = user_id);

drop policy if exists "equipamentos_select_own" on public.equipamentos;
drop policy if exists "equipamentos_insert_own" on public.equipamentos;
drop policy if exists "equipamentos_update_own" on public.equipamentos;
drop policy if exists "equipamentos_delete_own" on public.equipamentos;
create policy "equipamentos_select_own" on public.equipamentos for select using (auth.uid() = user_id);
create policy "equipamentos_insert_own" on public.equipamentos for insert with check (auth.uid() = user_id);
create policy "equipamentos_update_own" on public.equipamentos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "equipamentos_delete_own" on public.equipamentos for delete using (auth.uid() = user_id);

drop policy if exists "visitas_select_own" on public.visitas;
drop policy if exists "visitas_insert_own" on public.visitas;
drop policy if exists "visitas_update_own" on public.visitas;
drop policy if exists "visitas_delete_own" on public.visitas;
create policy "visitas_select_own" on public.visitas for select using (auth.uid() = user_id);
create policy "visitas_insert_own" on public.visitas for insert with check (auth.uid() = user_id);
create policy "visitas_update_own" on public.visitas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "visitas_delete_own" on public.visitas for delete using (auth.uid() = user_id);

drop policy if exists "checklists_select_own" on public.checklists_fazenda;
drop policy if exists "checklists_insert_own" on public.checklists_fazenda;
drop policy if exists "checklists_update_own" on public.checklists_fazenda;
drop policy if exists "checklists_delete_own" on public.checklists_fazenda;
create policy "checklists_select_own" on public.checklists_fazenda for select using (auth.uid() = user_id);
create policy "checklists_insert_own" on public.checklists_fazenda for insert with check (auth.uid() = user_id);
create policy "checklists_update_own" on public.checklists_fazenda for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checklists_delete_own" on public.checklists_fazenda for delete using (auth.uid() = user_id);

drop policy if exists "diagnosticos_select_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_insert_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_update_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_delete_own" on public.diagnosticos_realizados;
create policy "diagnosticos_select_own" on public.diagnosticos_realizados for select using (auth.uid() = user_id);
create policy "diagnosticos_insert_own" on public.diagnosticos_realizados for insert with check (auth.uid() = user_id);
create policy "diagnosticos_update_own" on public.diagnosticos_realizados for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diagnosticos_delete_own" on public.diagnosticos_realizados for delete using (auth.uid() = user_id);


-- Atualização V1.5.3: separar fazendas por central, regional e apoio veterinário.
alter table public.fazendas
add column if not exists central text,
add column if not exists regional_nome text,
add column if not exists veterinario_apoio text;


alter table public.fazendas
add column if not exists estado_uf text,
add column if not exists estado_nome text,
add column if not exists codigo_ibge_cidade text,
add column if not exists latitude numeric,
add column if not exists longitude numeric,
add column if not exists localizacao_origem text;


-- V2.0: planejamento de cobertura de antenas
create table if not exists public.planejamentos_antena (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  nome text not null,
  tipo_antena text default 'VP4102',
  latitude numeric not null,
  longitude numeric not null,
  raio_metros integer not null default 200,
  status text default 'Planejado',
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.planejamentos_antena enable row level security;
drop policy if exists "planejamentos_select_own" on public.planejamentos_antena;
create policy "planejamentos_select_own" on public.planejamentos_antena for select using (auth.uid() = user_id);
drop policy if exists "planejamentos_insert_own" on public.planejamentos_antena;
create policy "planejamentos_insert_own" on public.planejamentos_antena for insert with check (auth.uid() = user_id);
drop policy if exists "planejamentos_update_own" on public.planejamentos_antena;
create policy "planejamentos_update_own" on public.planejamentos_antena for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "planejamentos_delete_own" on public.planejamentos_antena;
create policy "planejamentos_delete_own" on public.planejamentos_antena for delete using (auth.uid() = user_id);

-- V2.1: planejamento de obstáculos e validação real de cobertura
create table if not exists public.obstaculos_cobertura (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  planejamento_id uuid references public.planejamentos_antena(id) on delete set null,
  nome text,
  tipo text not null,
  geometria text not null default 'ponto',
  pontos_json jsonb not null default '[]'::jsonb,
  altura_m numeric,
  intensidade text default 'Média',
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.testes_cobertura (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  planejamento_id uuid references public.planejamentos_antena(id) on delete set null,
  resultado text not null,
  latitude numeric not null,
  longitude numeric not null,
  observacoes text,
  testado_em timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.obstaculos_cobertura enable row level security;
alter table public.testes_cobertura enable row level security;

drop policy if exists "obstaculos_owner_all" on public.obstaculos_cobertura;
create policy "obstaculos_owner_all" on public.obstaculos_cobertura for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "testes_owner_all" on public.testes_cobertura;
create policy "testes_owner_all" on public.testes_cobertura for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- V2.2: raio estimado salvo diretamente no equipamento VP4102
alter table public.equipamentos
add column if not exists raio_metros integer default 75;

-- V3.3: compartilhamento de fazendas por usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nome text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fazenda_membros (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('viewer','admin')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (fazenda_id, user_id)
);

do $$
begin
  alter table public.fazenda_membros
    add constraint fazenda_membros_user_profile_fk
    foreign key (user_id) references public.profiles(id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

alter table public.profiles enable row level security;
alter table public.fazenda_membros enable row level security;

create or replace function public.farm_role(target_fazenda_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_user_id is null then null
    when exists (
      select 1 from public.fazendas f
      where f.id = target_fazenda_id and f.user_id = target_user_id
    ) then 'owner'
    else (
      select m.role from public.fazenda_membros m
      where m.fazenda_id = target_fazenda_id and m.user_id = target_user_id
      limit 1
    )
  end
$$;

create or replace function public.can_view_fazenda(target_fazenda_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.farm_role(target_fazenda_id, target_user_id) is not null
$$;

create or replace function public.can_write_fazenda(target_fazenda_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.farm_role(target_fazenda_id, target_user_id) in ('owner','admin')
$$;

create or replace function public.is_fazenda_owner(target_fazenda_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.farm_role(target_fazenda_id, target_user_id) = 'owner'
$$;

grant execute on function public.farm_role(uuid, uuid) to authenticated;
grant execute on function public.can_view_fazenda(uuid, uuid) to authenticated;
grant execute on function public.can_write_fazenda(uuid, uuid) to authenticated;
grant execute on function public.is_fazenda_owner(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select using (auth.uid() is not null);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "fazenda_membros_select_access" on public.fazenda_membros;
drop policy if exists "fazenda_membros_insert_owner" on public.fazenda_membros;
drop policy if exists "fazenda_membros_update_owner" on public.fazenda_membros;
drop policy if exists "fazenda_membros_delete_owner" on public.fazenda_membros;
create policy "fazenda_membros_select_access" on public.fazenda_membros for select using (public.can_view_fazenda(fazenda_id));
create policy "fazenda_membros_insert_owner" on public.fazenda_membros for insert with check (public.is_fazenda_owner(fazenda_id) and created_by = auth.uid());
create policy "fazenda_membros_update_owner" on public.fazenda_membros for update using (public.is_fazenda_owner(fazenda_id)) with check (public.is_fazenda_owner(fazenda_id));
create policy "fazenda_membros_delete_owner" on public.fazenda_membros for delete using (public.is_fazenda_owner(fazenda_id));

drop policy if exists "fazendas_select_own" on public.fazendas;
drop policy if exists "fazendas_insert_own" on public.fazendas;
drop policy if exists "fazendas_update_own" on public.fazendas;
drop policy if exists "fazendas_delete_own" on public.fazendas;
drop policy if exists "fazendas_select_access" on public.fazendas;
drop policy if exists "fazendas_insert_owner" on public.fazendas;
drop policy if exists "fazendas_update_admin" on public.fazendas;
drop policy if exists "fazendas_delete_owner" on public.fazendas;
create policy "fazendas_select_access" on public.fazendas for select using (public.can_view_fazenda(id));
create policy "fazendas_insert_owner" on public.fazendas for insert with check (auth.uid() = user_id);
create policy "fazendas_update_admin" on public.fazendas for update using (public.can_write_fazenda(id)) with check (public.can_write_fazenda(id));
create policy "fazendas_delete_owner" on public.fazendas for delete using (auth.uid() = user_id);

drop policy if exists "equipamentos_select_own" on public.equipamentos;
drop policy if exists "equipamentos_insert_own" on public.equipamentos;
drop policy if exists "equipamentos_update_own" on public.equipamentos;
drop policy if exists "equipamentos_delete_own" on public.equipamentos;
drop policy if exists "equipamentos_select_access" on public.equipamentos;
drop policy if exists "equipamentos_insert_admin" on public.equipamentos;
drop policy if exists "equipamentos_update_admin" on public.equipamentos;
drop policy if exists "equipamentos_delete_admin" on public.equipamentos;
create policy "equipamentos_select_access" on public.equipamentos for select using (public.can_view_fazenda(fazenda_id));
create policy "equipamentos_insert_admin" on public.equipamentos for insert with check (public.can_write_fazenda(fazenda_id));
create policy "equipamentos_update_admin" on public.equipamentos for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "equipamentos_delete_admin" on public.equipamentos for delete using (public.can_write_fazenda(fazenda_id));

drop policy if exists "visitas_select_own" on public.visitas;
drop policy if exists "visitas_insert_own" on public.visitas;
drop policy if exists "visitas_update_own" on public.visitas;
drop policy if exists "visitas_delete_own" on public.visitas;
drop policy if exists "visitas_select_access" on public.visitas;
drop policy if exists "visitas_insert_admin" on public.visitas;
drop policy if exists "visitas_update_admin" on public.visitas;
drop policy if exists "visitas_delete_admin" on public.visitas;
create policy "visitas_select_access" on public.visitas for select using (public.can_view_fazenda(fazenda_id));
create policy "visitas_insert_admin" on public.visitas for insert with check (public.can_write_fazenda(fazenda_id));
create policy "visitas_update_admin" on public.visitas for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "visitas_delete_admin" on public.visitas for delete using (public.can_write_fazenda(fazenda_id));

drop policy if exists "checklists_select_own" on public.checklists_fazenda;
drop policy if exists "checklists_insert_own" on public.checklists_fazenda;
drop policy if exists "checklists_update_own" on public.checklists_fazenda;
drop policy if exists "checklists_delete_own" on public.checklists_fazenda;
drop policy if exists "checklists_select_access" on public.checklists_fazenda;
drop policy if exists "checklists_insert_admin" on public.checklists_fazenda;
drop policy if exists "checklists_update_admin" on public.checklists_fazenda;
drop policy if exists "checklists_delete_admin" on public.checklists_fazenda;
create policy "checklists_select_access" on public.checklists_fazenda for select using (public.can_view_fazenda(fazenda_id));
create policy "checklists_insert_admin" on public.checklists_fazenda for insert with check (public.can_write_fazenda(fazenda_id));
create policy "checklists_update_admin" on public.checklists_fazenda for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "checklists_delete_admin" on public.checklists_fazenda for delete using (public.can_write_fazenda(fazenda_id));

drop policy if exists "diagnosticos_select_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_insert_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_update_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_delete_own" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_select_access" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_insert_admin" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_update_admin" on public.diagnosticos_realizados;
drop policy if exists "diagnosticos_delete_admin" on public.diagnosticos_realizados;
create policy "diagnosticos_select_access" on public.diagnosticos_realizados for select using ((fazenda_id is null and auth.uid() = user_id) or public.can_view_fazenda(fazenda_id));
create policy "diagnosticos_insert_admin" on public.diagnosticos_realizados for insert with check ((fazenda_id is null and auth.uid() = user_id) or public.can_write_fazenda(fazenda_id));
create policy "diagnosticos_update_admin" on public.diagnosticos_realizados for update using ((fazenda_id is null and auth.uid() = user_id) or public.can_write_fazenda(fazenda_id)) with check ((fazenda_id is null and auth.uid() = user_id) or public.can_write_fazenda(fazenda_id));
create policy "diagnosticos_delete_admin" on public.diagnosticos_realizados for delete using ((fazenda_id is null and auth.uid() = user_id) or public.can_write_fazenda(fazenda_id));

drop policy if exists "planejamentos_select_own" on public.planejamentos_antena;
drop policy if exists "planejamentos_insert_own" on public.planejamentos_antena;
drop policy if exists "planejamentos_update_own" on public.planejamentos_antena;
drop policy if exists "planejamentos_delete_own" on public.planejamentos_antena;
drop policy if exists "planejamentos_select_access" on public.planejamentos_antena;
drop policy if exists "planejamentos_insert_admin" on public.planejamentos_antena;
drop policy if exists "planejamentos_update_admin" on public.planejamentos_antena;
drop policy if exists "planejamentos_delete_admin" on public.planejamentos_antena;
create policy "planejamentos_select_access" on public.planejamentos_antena for select using (public.can_view_fazenda(fazenda_id));
create policy "planejamentos_insert_admin" on public.planejamentos_antena for insert with check (public.can_write_fazenda(fazenda_id));
create policy "planejamentos_update_admin" on public.planejamentos_antena for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "planejamentos_delete_admin" on public.planejamentos_antena for delete using (public.can_write_fazenda(fazenda_id));

drop policy if exists "obstaculos_owner_all" on public.obstaculos_cobertura;
drop policy if exists "testes_owner_all" on public.testes_cobertura;
drop policy if exists "obstaculos_select_access" on public.obstaculos_cobertura;
drop policy if exists "obstaculos_insert_admin" on public.obstaculos_cobertura;
drop policy if exists "obstaculos_update_admin" on public.obstaculos_cobertura;
drop policy if exists "obstaculos_delete_admin" on public.obstaculos_cobertura;
drop policy if exists "testes_select_access" on public.testes_cobertura;
drop policy if exists "testes_insert_admin" on public.testes_cobertura;
drop policy if exists "testes_update_admin" on public.testes_cobertura;
drop policy if exists "testes_delete_admin" on public.testes_cobertura;
create policy "obstaculos_select_access" on public.obstaculos_cobertura for select using (public.can_view_fazenda(fazenda_id));
create policy "obstaculos_insert_admin" on public.obstaculos_cobertura for insert with check (public.can_write_fazenda(fazenda_id));
create policy "obstaculos_update_admin" on public.obstaculos_cobertura for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "obstaculos_delete_admin" on public.obstaculos_cobertura for delete using (public.can_write_fazenda(fazenda_id));
create policy "testes_select_access" on public.testes_cobertura for select using (public.can_view_fazenda(fazenda_id));
create policy "testes_insert_admin" on public.testes_cobertura for insert with check (public.can_write_fazenda(fazenda_id));
create policy "testes_update_admin" on public.testes_cobertura for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "testes_delete_admin" on public.testes_cobertura for delete using (public.can_write_fazenda(fazenda_id));

-- V3.6: produtividade por fazenda
alter table public.fazendas
add column if not exists servico_inicio_em timestamptz,
add column if not exists servico_fim_em timestamptz,
add column if not exists servico_responsavel text,
add column if not exists servico_observacoes text;

create index if not exists fazendas_servico_inicio_idx on public.fazendas(servico_inicio_em);
create index if not exists fazendas_servico_fim_idx on public.fazendas(servico_fim_em);

-- V3.8: evidencias fotograficas da instalacao
create table if not exists public.evidencias_fazenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  visita_id uuid references public.visitas(id) on delete set null,
  categoria text not null default 'Instalação finalizada',
  descricao text,
  arquivo_path text,
  arquivo_url text,
  arquivo_nome text,
  mime_type text,
  tamanho_bytes integer,
  inclui_relatorio boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.evidencias_fazenda enable row level security;

drop policy if exists "evidencias_select_access" on public.evidencias_fazenda;
drop policy if exists "evidencias_insert_admin" on public.evidencias_fazenda;
drop policy if exists "evidencias_update_admin" on public.evidencias_fazenda;
drop policy if exists "evidencias_delete_admin" on public.evidencias_fazenda;
create policy "evidencias_select_access" on public.evidencias_fazenda for select using (public.can_view_fazenda(fazenda_id));
create policy "evidencias_insert_admin" on public.evidencias_fazenda for insert with check (public.can_write_fazenda(fazenda_id));
create policy "evidencias_update_admin" on public.evidencias_fazenda for update using (public.can_write_fazenda(fazenda_id)) with check (public.can_write_fazenda(fazenda_id));
create policy "evidencias_delete_admin" on public.evidencias_fazenda for delete using (public.can_write_fazenda(fazenda_id));

create index if not exists evidencias_fazenda_idx on public.evidencias_fazenda(fazenda_id, created_at desc);
create index if not exists evidencias_equipamento_idx on public.evidencias_fazenda(equipamento_id);
create index if not exists evidencias_visita_idx on public.evidencias_fazenda(visita_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fazenda-evidencias',
  'fazenda-evidencias',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "evidencias_storage_select_access" on storage.objects;
drop policy if exists "evidencias_storage_insert_admin" on storage.objects;
drop policy if exists "evidencias_storage_update_admin" on storage.objects;
drop policy if exists "evidencias_storage_delete_admin" on storage.objects;
create policy "evidencias_storage_select_access" on storage.objects for select using (
  bucket_id = 'fazenda-evidencias'
  and public.can_view_fazenda((storage.foldername(name))[1]::uuid)
);
create policy "evidencias_storage_insert_admin" on storage.objects for insert with check (
  bucket_id = 'fazenda-evidencias'
  and public.can_write_fazenda((storage.foldername(name))[1]::uuid)
);
create policy "evidencias_storage_update_admin" on storage.objects for update using (
  bucket_id = 'fazenda-evidencias'
  and public.can_write_fazenda((storage.foldername(name))[1]::uuid)
) with check (
  bucket_id = 'fazenda-evidencias'
  and public.can_write_fazenda((storage.foldername(name))[1]::uuid)
);
create policy "evidencias_storage_delete_admin" on storage.objects for delete using (
  bucket_id = 'fazenda-evidencias'
  and public.can_write_fazenda((storage.foldername(name))[1]::uuid)
);
