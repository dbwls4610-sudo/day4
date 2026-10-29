-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- 로그인한 사용자가 마음에 드는 제주 사진을 "보관함(favorites)"에 저장하는 테이블입니다.

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pixabay_id  bigint not null,
  image_url   text not null,
  large_url   text,
  tags        text,
  page_url    text,
  created_at  timestamptz not null default now(),
  unique (user_id, pixabay_id)
);

-- RLS(행 단위 보안): 내 데이터만 보고, 넣고, 지울 수 있어요.
alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);
