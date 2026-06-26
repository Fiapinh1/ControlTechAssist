create extension if not exists pgcrypto;

create table if not exists public.fazendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  responsavel text,
  telefone text,
  cidade text,
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
