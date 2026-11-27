import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../config/integrations';

const hasValidSupabaseKeys = 
  Boolean(APP_ENV.SUPABASE_URL && APP_ENV.SUPABASE_ANON_KEY && 
  APP_ENV.SUPABASE_URL.startsWith('http') && 
  !APP_ENV.SUPABASE_URL.includes('your-project'));

// Cliente Supabase real (inicializado com chave válida ou dummy para evitar crash)
export const supabase = createClient(
  hasValidSupabaseKeys ? APP_ENV.SUPABASE_URL : 'https://placeholder.supabase.co',
  hasValidSupabaseKeys ? APP_ENV.SUPABASE_ANON_KEY : 'dummy-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = hasValidSupabaseKeys;

/**
 * Exclui definitivamente a conta do usuário autenticado no Supabase.
 * Chama a função RPC `delete_user_account` (ver SUPABASE_SCHEMA_SQL), que roda
 * com `security definer` e remove o registro em auth.users do próprio usuário
 * (auth.uid()). Os dados em public.users / public.bars caem em cascata.
 * Exigência da Apple (Guideline 5.1.1(v)) e do Google Play para apps com cadastro.
 *
 * Sem Supabase configurado (modo demo) não faz nada: a exclusão é apenas local.
 */
export const deleteSupabaseAccount = async (): Promise<void> => {
  if (!isSupabaseConfigured) return;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    // Sem sessão ativa no Supabase (ex.: login demo local), nada a excluir remotamente.
    return;
  }

  const { error } = await supabase.rpc('delete_user_account');
  if (error) {
    throw new Error(`Não foi possível excluir a conta no servidor: ${error.message}`);
  }

  await supabase.auth.signOut();
};

/**
 * Script SQL para inicialização do Supabase caso o usuário crie um projeto novo.
 * Pode ser exibido no painel admin para o usuário copiar e colar no SQL Editor do Supabase com 1 clique!
 */
export const SUPABASE_SCHEMA_SQL = `-- Script de Criação das Tabelas FlowStock (B2B de Bebidas)
-- Cole este script no painel do Supabase: SQL Editor > New Query > Run

-- 1. Tabela de Usuários / Contas
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  role text not null check (role in ('bar_owner', 'supplier', 'admin')),
  avatar_url text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabela de Bares (Clientes podem ter múltiplos bares)
create table if not exists public.bars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  trading_name text,
  cnpj text not null,
  street text not null,
  number text not null,
  neighborhood text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  phone text not null,
  status text default 'active' check (status in ('active', 'pending_approval', 'blocked')),
  credit_limit numeric(10,2) default 5000.00,
  credit_used numeric(10,2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Tabela de Fornecedores / Distribuidores de Bebidas
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete set null,
  trade_name text not null,
  corporate_name text not null,
  cnpj text unique not null,
  phone text not null,
  email text not null,
  status text default 'active' check (status in ('active', 'pending_approval', 'suspended')),
  commission_rate numeric(5,2) default 5.00,
  min_order_value numeric(10,2) default 300.00,
  delivery_fee numeric(10,2) default 0.00,
  delivery_time_estimate text default 'Hoje até 18h',
  categories text[] default array['cervejas', 'destilados'],
  logo_url text,
  banner_url text,
  rating numeric(3,2) default 5.0,
  bank_pix_key text,
  city text not null,
  state text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Tabela de Produtos / Bebidas
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete cascade,
  name text not null,
  brand text not null,
  description text,
  category text not null,
  unit text not null,
  price numeric(10,2) not null,
  stock integer default 100,
  is_returnable_bottle boolean default false,
  image_url text,
  min_order_units integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Tabela de Pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid references public.bars(id),
  supplier_id uuid references public.suppliers(id),
  items jsonb not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) default 0.00,
  total numeric(10,2) not null,
  payment_method text not null,
  payment_status text default 'pending',
  status text default 'pending_payment',
  needs_returnable_bottles_exchange boolean default false,
  delivery_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Exclusão de conta pelo próprio usuário (exigência Apple / Google Play)
-- O app chama supabase.rpc('delete_user_account'). Remove o usuário autenticado
-- de public.users (bares caem em cascata) e de auth.users.
-- Pedidos são mantidos para fins fiscais, desvinculados do bar excluído.
alter table public.orders drop constraint if exists orders_bar_id_fkey;
alter table public.orders
  add constraint orders_bar_id_fkey foreign key (bar_id)
  references public.bars(id) on delete set null;

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Usuário não autenticado';
  end if;
  delete from public.users where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user_account() from public, anon;
grant execute on function public.delete_user_account() to authenticated;
`;
