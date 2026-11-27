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
`;
