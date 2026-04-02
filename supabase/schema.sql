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
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'user_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  final_username := base_username;

  while exists (select 1 from profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix;
  end loop;

  insert into profiles (id, username, avatar_url)
  values (new.id, final_username, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  return new;
exception when others then
  -- 绝不阻断用户创建，profile 可后续补建
  raise warning 'handle_new_user error: % %', sqlstate, sqlerrm;
  return new;
end;
$$;

-- ══ 5. API Token ═════════════════════════════════
create table if not exists api_tokens (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  label       text default 'OpenPat',
  created_at  timestamptz default now(),
  last_used_at timestamptz
);

alter table api_tokens enable row level security;

create policy "Users can manage own tokens"
  on api_tokens for all
  using (auth.uid() = user_id);

-- ══ 6. Stats 累加函数（供 Edge Function 调用）════════════
create or replace function increment_tasks(uid uuid)
returns void language sql security definer as $$
  update profiles set total_tasks = total_tasks + 1, updated_at = now()
  where id = uid;
$$;

create or replace function increment_tool_calls(uid uuid)
returns void language sql security definer as $$
  update profiles set total_tool_calls = total_tool_calls + 1, updated_at = now()
  where id = uid;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
