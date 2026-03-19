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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public real-time status
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

-- Roadmap items (admin managed)
create table if not exists roadmap_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'planned', -- 'live', 'planned', 'future'
  emoji text default '✨',
  vote_count integer default 0,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table roadmap_items enable row level security;
create policy "Roadmap items viewable by everyone" on roadmap_items for select using (true);
create policy "Admins can manage roadmap" on roadmap_items for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.username = 'admin')
);

-- Roadmap votes (one per user per item)
create table if not exists roadmap_votes (
  user_id uuid references profiles(id) on delete cascade,
  item_id uuid references roadmap_items(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, item_id)
);

alter table roadmap_votes enable row level security;
create policy "Votes viewable by everyone" on roadmap_votes for select using (true);
create policy "Users can manage own votes" on roadmap_votes for all using (auth.uid() = user_id);

-- Auto update vote_count on insert/delete
create or replace function update_vote_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update roadmap_items set vote_count = vote_count + 1 where id = NEW.item_id;
  elsif TG_OP = 'DELETE' then
    update roadmap_items set vote_count = greatest(0, vote_count - 1) where id = OLD.item_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_vote_change on roadmap_votes;
create trigger on_vote_change
  after insert or delete on roadmap_votes
  for each row execute procedure update_vote_count();

-- Feedback submissions
create table if not exists feedback_submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);

alter table feedback_submissions enable row level security;
create policy "Users can submit feedback" on feedback_submissions for insert with check (auth.uid() = user_id or auth.uid() is null);
create policy "Admins can read feedback" on feedback_submissions for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.username = 'admin')
);
