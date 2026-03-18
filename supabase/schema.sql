-- Run this in your Supabase SQL editor

-- User profiles
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  total_tasks integer default 0,
  total_tool_calls integer default 0,
  total_tokens_input bigint default 0,
  total_tokens_output bigint default 0,
  achievements text[] default '{}',
  level integer default 0,
  owned_skins text[] default '{classic}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public real-time status (only enum values, no business data)
create table if not exists agent_status (
  user_id uuid references profiles(id) on delete cascade primary key,
  status text not null default 'offline',
  current_tool text,
  session_tokens bigint default 0,
  session_tool_calls integer default 0,
  is_public boolean default true,
  updated_at timestamptz default now()
);

-- Enable realtime on agent_status
alter publication supabase_realtime add table agent_status;

-- RLS
alter table profiles enable row level security;
alter table agent_status enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Public status viewable if is_public"
  on agent_status for select using (is_public = true or auth.uid() = user_id);

create policy "Users can upsert own status"
  on agent_status for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Skin metadata table
create table if not exists skins (
  id text primary key,
  name text not null,
  description text,
  price numeric default 0,
  rarity text default 'common',
  colors jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table skins enable row level security;

create policy "Skins are viewable by everyone"
  on skins for select using (true);

create policy "Admins can manage skins"
  on skins for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.username = 'admin' -- Basic admin check for MVP
    )
  );
