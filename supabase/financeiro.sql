-- DOM Web Financeiro: tabelas do financeiro (no MESMO projeto Supabase da hamburgueria)
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo inteiro > Run.
-- Pode rodar mais de uma vez sem problema.
--
-- Segurança:
--  - Só o DONO lê e grava o financeiro. Garçom, caixa, cozinha e gerente não têm acesso.
--  - O financeiro só LÊ as vendas da hamburgueria (tabelas pedidos e registros); nunca altera nada nelas.

-- Cargo de quem está logado (a mesma função usada pelo DOM Web). Sem cargo = dono.
create or replace function public.cargo() returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'cargo', 'dono')
$$;

create table if not exists public.fin_registros (
  id text primary key,
  colecao text not null,          -- lancamentos, recorrentes, carteiras, metas, orcamentos, config
  criado_em timestamptz not null default now(),
  dados jsonb not null default '{}'
);
create index if not exists fin_registros_colecao_idx on public.fin_registros (colecao, criado_em desc);

alter table public.fin_registros enable row level security;
drop policy if exists fin_dono on public.fin_registros;
create policy fin_dono on public.fin_registros for all to authenticated
  using (public.cargo() = 'dono') with check (public.cargo() = 'dono');

-- As fotos de comprovantes ficam dentro do próprio registro (reduzidas), protegidas pela mesma regra acima.
