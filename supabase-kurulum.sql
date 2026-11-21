-- Element Arenası: Supabase kurulumu
-- ÖNEMLİ: Aşağıdaki SAHIP@gmail.com yazan 4 yeri kendi Gmail adresinle değiştir, sonra hepsini çalıştır.

-- Hazır modeller listesi
create table if not exists public.models (
  id text primary key,
  data jsonb not null,
  t bigint not null default 0
);
alter table public.models enable row level security;
drop policy if exists "herkes okur" on public.models;
create policy "herkes okur" on public.models for select using (true);
drop policy if exists "sahip yazar" on public.models;
create policy "sahip yazar" on public.models for all to authenticated
  using ((auth.jwt() ->> 'email') = 'SAHIP@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'SAHIP@gmail.com');
alter publication supabase_realtime add table public.models;

-- Model dosyaları (herkes indirir, sadece sahip yükler/siler)
insert into storage.buckets (id, name, public) values ('assets', 'assets', true)
  on conflict (id) do update set public = true;
drop policy if exists "sahip yukler" on storage.objects;
create policy "sahip yukler" on storage.objects for insert to authenticated
  with check (bucket_id = 'assets' and (auth.jwt() ->> 'email') = 'SAHIP@gmail.com');
drop policy if exists "sahip siler" on storage.objects;
create policy "sahip siler" on storage.objects for delete to authenticated
  using (bucket_id = 'assets' and (auth.jwt() ->> 'email') = 'SAHIP@gmail.com');
