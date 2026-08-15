-- Rulează acest script O SINGURĂ DATĂ în Supabase: Project -> SQL Editor -> New query
-- -> lipește tot conținutul -> Run.

create table if not exists enoriasi (
  id bigint generated always as identity primary key,
  nume text not null,
  prenume text not null,
  data_nasterii date not null,
  domiciliu text,
  mentiuni text,
  created_at timestamptz not null default now()
);

-- Row Level Security activat, FĂRĂ nicio policy publică: doar cheia service_role
-- (folosită exclusiv server-side, în aplicație, niciodată în browser) poate citi
-- sau scrie date. Cheia publică (anon) nu are acces la acest tabel, chiar dacă
-- cineva ar afla adresa proiectului Supabase.
alter table enoriasi enable row level security;
