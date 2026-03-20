-- OpenPat — 一次性运行此文件完成全部建表
-- 在 Supabase SQL Editor 粘贴运行即可

-- ══ 1. 用户档案 ══════════════════════════════════════════
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null,
  avatar_url      text,
  total_tasks     integer  default 0,
  total_tool_calls integer default 0,
  total_tokens_input  bigint default 0,
  total_tokens_output bigint default 0,
  achievements    text[]   default '{}',
  level           integer  default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- ══ 2. 实时 Agent 状态 ════════════════════════════════════
create table if not exists agent_status (
  user_id           uuid references profiles(id) on delete cascade primary key,
  status            text    not null default 'offline',
  current_tool      text,
  session_tokens    bigint  default 0,
  session_tool_calls integer default 0,
  is_public         boolean default true,
  updated_at        timestamptz default now()
);

alter publication supabase_realtime add table agent_status;

alter table agent_status enable row level security;

create policy "Public status viewable if is_public"
  on agent_status for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can upsert own status"
  on agent_status for all
  using (auth.uid() = user_id);

-- ══ 3. 用户反馈 ═══════════════════════════════════════════
create table if not exists feedback_submissions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete set null,
  content    text not null,
  created_at timestamptz default now()
);

alter table feedback_submissions enable row level security;

-- 登录用户提交：user_id 必须等于自己
create policy "Logged-in users can submit feedback"
  on feedback_submissions for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

-- 匿名用户提交：user_id 必须为 null
create policy "Anonymous users can submit feedback"
  on feedback_submissions for insert
  with check (auth.uid() is null and user_id is null);

-- 只有管理员可以读取反馈
create policy "Admins can read feedback"
  on feedback_submissions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.username = 'admin'
    )
  );

-- ══ 4. 新用户自动建档 ════════════════════════════════════
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
