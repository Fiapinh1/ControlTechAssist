-- ControlTech Assist V1.1
-- Execute este arquivo no SQL Editor do Supabase.
-- Ele cria as tabelas principais com RLS para cada usuário ver apenas seus próprios dados.

create extension if not exists pgcrypto;

create table if not exists public.fazendas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  responsavel text,
  telefone text,
  cidade text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locais_fazenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  nome text not null,
  descricao text,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipamentos_instalados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  local_id uuid references public.locais_fazenda(id) on delete set null,
  codigo text not null,
  tipo text not null default 'VP',
  status text not null default 'Instalado',
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  observacoes text,
  instalado_em date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registros_campo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fazenda_id uuid references public.fazendas(id) on delete set null,
  titulo text not null,
  tipo text not null default 'Instalação',
  descricao text,
  solucao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_fazendas_updated_at on public.fazendas;
create trigger set_fazendas_updated_at before update on public.fazendas for each row execute function public.set_updated_at();

drop trigger if exists set_locais_fazenda_updated_at on public.locais_fazenda;
create trigger set_locais_fazenda_updated_at before update on public.locais_fazenda for each row execute function public.set_updated_at();

drop trigger if exists set_equipamentos_instalados_updated_at on public.equipamentos_instalados;
create trigger set_equipamentos_instalados_updated_at before update on public.equipamentos_instalados for each row execute function public.set_updated_at();

drop trigger if exists set_registros_campo_updated_at on public.registros_campo;
create trigger set_registros_campo_updated_at before update on public.registros_campo for each row execute function public.set_updated_at();

alter table public.fazendas enable row level security;
alter table public.locais_fazenda enable row level security;
alter table public.equipamentos_instalados enable row level security;
alter table public.registros_campo enable row level security;

-- Fazendas
create policy "fazendas_select_own" on public.fazendas for select using (auth.uid() = user_id);
create policy "fazendas_insert_own" on public.fazendas for insert with check (auth.uid() = user_id);
create policy "fazendas_update_own" on public.fazendas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fazendas_delete_own" on public.fazendas for delete using (auth.uid() = user_id);

-- Locais
create policy "locais_select_own" on public.locais_fazenda for select using (auth.uid() = user_id);
create policy "locais_insert_own" on public.locais_fazenda for insert with check (auth.uid() = user_id);
create policy "locais_update_own" on public.locais_fazenda for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "locais_delete_own" on public.locais_fazenda for delete using (auth.uid() = user_id);

-- Equipamentos
create policy "equipamentos_select_own" on public.equipamentos_instalados for select using (auth.uid() = user_id);
create policy "equipamentos_insert_own" on public.equipamentos_instalados for insert with check (auth.uid() = user_id);
create policy "equipamentos_update_own" on public.equipamentos_instalados for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "equipamentos_delete_own" on public.equipamentos_instalados for delete using (auth.uid() = user_id);

-- Registros
create policy "registros_select_own" on public.registros_campo for select using (auth.uid() = user_id);
create policy "registros_insert_own" on public.registros_campo for insert with check (auth.uid() = user_id);
create policy "registros_update_own" on public.registros_campo for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "registros_delete_own" on public.registros_campo for delete using (auth.uid() = user_id);

create index if not exists idx_fazendas_user_id on public.fazendas(user_id);
create index if not exists idx_locais_fazenda_user_id on public.locais_fazenda(user_id);
create index if not exists idx_locais_fazenda_fazenda_id on public.locais_fazenda(fazenda_id);
create index if not exists idx_equipamentos_user_id on public.equipamentos_instalados(user_id);
create index if not exists idx_equipamentos_fazenda_id on public.equipamentos_instalados(fazenda_id);
create index if not exists idx_registros_user_id on public.registros_campo(user_id);
create index if not exists idx_registros_fazenda_id on public.registros_campo(fazenda_id);
