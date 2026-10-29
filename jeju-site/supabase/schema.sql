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


-- ───────────────────────── 장바구니(cart_items) ─────────────────────────
-- 로그인한 사용자가 담은 상품을 저장하는 테이블입니다. (위 favorites 와 똑같이 SQL Editor 에서 Run)
-- 상품 테이블이 따로 없으므로 담는 시점의 상품명/가격/이미지를 그대로 저장합니다.

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id     text not null,                          -- 상품 식별자 (예: 사진 ID, 상품 코드)
  name        text not null,
  price       integer not null default 0 check (price >= 0),
  quantity    integer not null default 1 check (quantity > 0),
  image_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, item_id)                           -- 같은 상품은 한 줄로 합치고 수량만 늘립니다
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

alter table public.cart_items enable row level security;

drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own" on public.cart_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own" on public.cart_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own" on public.cart_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own" on public.cart_items
  for delete to authenticated using ((select auth.uid()) = user_id);
