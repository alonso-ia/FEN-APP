-- Tabla de usuarios
create table if not exists users (
  username text primary key,
  pin text not null,
  balance bigint not null default 0,
  invited_by text references users(username),
  created_at timestamptz not null default now()
);

-- Tabla de códigos de invitación
create table if not exists invites (
  code text primary key,
  created_by text not null references users(username),
  used_by text references users(username),
  created_at timestamptz not null default now()
);

-- Tabla de transacciones
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  "from" text not null references users(username),
  "to" text not null references users(username),
  amount bigint not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

-- Índices para consultas rápidas
create index if not exists idx_tx_from on transactions("from");
create index if not exists idx_tx_to on transactions("to");
create index if not exists idx_invites_created_by on invites(created_by);

-- Deshabilitar RLS (app de grupo cerrado, seguridad por PIN)
alter table users disable row level security;
alter table invites disable row level security;
alter table transactions disable row level security;
