-- Migration 001: Ensure token columns use the correct split-column schema.
-- Run this in Supabase SQL Editor if the profiles table was created with an older
-- version of schema.sql that used a single `total_tokens` column.

-- Add split columns if they don't exist (idempotent)
alter table profiles
  add column if not exists total_tokens_input  bigint default 0,
  add column if not exists total_tokens_output bigint default 0;

-- If a legacy total_tokens column exists, migrate its value into total_tokens_input
-- and then drop it. Skip silently if it doesn't exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'total_tokens'
  ) then
    update profiles
      set total_tokens_input = coalesce(total_tokens_input, 0)
                             + coalesce(total_tokens, 0)
      where total_tokens > 0 and (total_tokens_input + total_tokens_output) = 0;
    alter table profiles drop column total_tokens;
  end if;
end;
$$;
