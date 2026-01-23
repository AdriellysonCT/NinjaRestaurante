-- Create table for delivery messages
create table if not exists mensagens_entrega (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos_padronizados(id) on delete cascade,
  remetente_id uuid references auth.users(id),
  tipo_remetente text check (tipo_remetente in ('restaurante', 'entregador')),
  conteudo text not null,
  lida boolean default false,
  criado_em timestamp with time zone default now()
);

-- Index for performance
create index if not exists idx_mensagens_entrega_pedido on mensagens_entrega(pedido_id);
create index if not exists idx_mensagens_entrega_lida on mensagens_entrega(lida) where lida = false;

-- RLS Policies
alter table mensagens_entrega enable row level security;

-- Policy: Authenticated users can select messages (refined later for strict privacy)
create policy "Authenticated users can select messages"
  on mensagens_entrega for select
  to authenticated
  using (true);

-- Policy: Users can insert their own messages
create policy "Authenticated users can insert messages"
  on mensagens_entrega for insert
  to authenticated
  with check (auth.uid() = remetente_id);
