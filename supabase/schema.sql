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
