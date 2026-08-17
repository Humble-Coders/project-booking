-- ============================================================
-- Humble Coders, Project Booking (schema v2: code-based booking)
-- Run this whole file once in the Supabase SQL Editor.
-- Idempotent: safe to re-run.
--
-- v2 model (PRD §4): codes live on students (hashed, persistent,
-- replaced on resend), the v1 otps table is gone, and a
-- trigger-maintained seat_counts table powers Supabase Realtime.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.students (
  email      text primary key,
  added_at   timestamptz not null default now()
);

-- v2 columns: one active code per student, hash only, plus Resend delivery tracking.
alter table public.students add column if not exists code_hash       text unique;
alter table public.students add column if not exists code_sent_at    timestamptz;
alter table public.students add column if not exists resend_email_id text;
alter table public.students add column if not exists delivery_status text not null default 'none';

do $$ begin
  alter table public.students
    add constraint students_delivery_status_check
    check (delivery_status in ('none','sent','delivered','bounced','failed'));
exception when duplicate_object then null;
end $$;

create table if not exists public.projects (
  id          int primary key,
  title       text not null,
  description text not null,
  api_name    text not null,
  api_url     text not null,
  api_note    text not null default 'No key needed',
  capacity    int  not null default 10
);

create table if not exists public.bookings (
  id         bigint generated always as identity primary key,
  email      text not null unique references public.students (email),
  project_id int  not null references public.projects (id),
  booked_at  timestamptz not null default now()
);

create index if not exists bookings_project_idx on public.bookings (project_id);

-- ---------- Student email normalisation ----------
-- students.email is both the primary key and the identity a booking hangs off,
-- so two casings of one address were two students, i.e. two bookings for one
-- human. Lowercase (and trimmed) at rest closes that for good. Existing rows are
-- repaired first; a genuine case clash is never merged automatically, it stops
-- the script and names the addresses for the instructor to resolve by hand.

do $$
declare v_clashes text;
begin
  select string_agg(e, ', ') into v_clashes
  from (
    select lower(btrim(email)) as e
    from public.students
    group by lower(btrim(email))
    having count(*) > 1
  ) d;
  if v_clashes is not null then
    raise exception
      'Student emails clash by case or whitespace: %. Merge them by hand (keep the row holding the booking, delete the other), then re-run this script.',
      v_clashes;
  end if;
end $$;

-- Lowercasing a primary key has to carry its bookings with it, and fixing a
-- typo'd address later should move the booking too, so the FK cascades.
alter table public.bookings drop constraint if exists bookings_email_fkey;
alter table public.bookings
  add constraint bookings_email_fkey
  foreign key (email) references public.students (email) on update cascade;

update public.students
   set email = lower(btrim(email))
 where email <> lower(btrim(email));

do $$ begin
  alter table public.students
    add constraint students_email_lowercase check (email = lower(btrim(email)));
exception when duplicate_object then null;
end $$;

-- Realtime seat feed: aggregate integers only, maintained by trigger below.
create table if not exists public.seat_counts (
  project_id int primary key references public.projects (id),
  booked     int not null default 0
);

-- The booking gate: one row, flipped by the instructor from the dashboard.
-- Browsing the catalogue is always open; booking is refused until this is true.
-- Defaults to false so a fresh (or restored) database is never accidentally open.
create table if not exists public.settings (
  id           int primary key,
  booking_open boolean not null default false,
  updated_at   timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id, booking_open) values (1, false)
on conflict (id) do nothing;

-- v1 leftover: codes are per-student now, not per-booking.
drop table if exists public.otps;

-- ---------- seat_counts trigger ----------

create or replace function public.bump_seat_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into seat_counts (project_id, booked) values (new.project_id, 1)
    on conflict (project_id) do update set booked = seat_counts.booked + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update seat_counts set booked = greatest(booked - 1, 0)
    where project_id = old.project_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists bookings_seat_count on public.bookings;
create trigger bookings_seat_count
  after insert or delete on public.bookings
  for each row execute function public.bump_seat_count();

-- ---------- Lock everything down ----------
-- RLS on with ZERO policies on students/projects/bookings: the anon key
-- reads/writes nothing directly. The only doors in are the two functions
-- below. Two read-only exceptions, both realtime feeds carrying no personal
-- data: seat_counts (two integers per project) and settings (one boolean).
-- Neither has an INSERT/UPDATE/DELETE policy, so anon can look and nothing more.

alter table public.students    enable row level security;
alter table public.projects    enable row level security;
alter table public.bookings    enable row level security;
alter table public.seat_counts enable row level security;
alter table public.settings    enable row level security;

drop policy if exists seat_counts_public_read on public.seat_counts;
create policy seat_counts_public_read
  on public.seat_counts for select
  to anon, authenticated
  using (true);

drop policy if exists settings_public_read on public.settings;
create policy settings_public_read
  on public.settings for select
  to anon, authenticated
  using (true);

-- Realtime: publish seat_counts + settings changes; FULL identity so UPDATE
-- events carry the row values. The settings feed is what makes "booking is
-- open" land in every open browser within a second or so of the instructor
-- flipping it, instead of whenever each client next polls.
alter table public.seat_counts replica identity full;
alter table public.settings    replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.seat_counts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.settings;
exception when duplicate_object then null;
end $$;

-- ---------- Public read: project list with live seat counts ----------

create or replace function public.get_projects()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',          p.id,
    'title',       p.title,
    'description', p.description,
    'api_name',    p.api_name,
    'api_url',     p.api_url,
    'api_note',    p.api_note,
    'capacity',    p.capacity,
    'seats_left',  greatest(p.capacity - coalesce(sc.booked, 0), 0)
  ) order by p.id), '[]'::jsonb)
  from public.projects p
  left join public.seat_counts sc on sc.project_id = p.id;
$$;

-- ---------- Atomic booking: code identifies the student, race-safe ----------
-- The code alone is the student's identity (PRD decision #2). Concurrency:
-- "for update" on the project row serializes all bookings for that project,
-- so the seat-count check is exact, first 10 win, the rest get 'full'.
-- Error contract (fixed, see CLAUDE.md):
--   not_open | invalid_code | already_booked (+project) | no_project | full
--   success: ok + email + project

drop function if exists public.book_project(text, text, int);

create or replace function public.book_project(p_code text, p_project_id int)
returns jsonb
language plpgsql
security definer
-- 'extensions' in the path: Supabase installs pgcrypto (digest) there, not in public
set search_path = public, extensions
as $$
declare
  v_hash     text := encode(digest(upper(trim(p_code)), 'sha256'), 'hex');
  v_student  record;
  v_project  record;
  v_taken    int;
  v_existing text;
begin
  -- 0. The instructor's gate, checked before anything else. While booking is
  -- closed no student lookup happens at all, so a closed system cannot be used
  -- to probe which codes are valid: every attempt gets the same not_open.
  -- A missing settings row counts as closed, never as open.
  if not coalesce((select booking_open from settings where id = 1), false) then
    return jsonb_build_object('ok', false, 'error', 'not_open');
  end if;

  -- 1. The code identifies the student
  select * into v_student from students where code_hash = v_hash;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  -- 2. One booking per student
  select pr.title into v_existing
  from bookings b join projects pr on pr.id = b.project_id
  where b.email = v_student.email;
  if found then
    return jsonb_build_object('ok', false, 'error', 'already_booked', 'project', v_existing);
  end if;

  -- 3. Lock the project row, then check capacity (race-safe)
  select * into v_project from projects where id = p_project_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_project');
  end if;

  select count(*) into v_taken from bookings where project_id = p_project_id;
  if v_taken >= v_project.capacity then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  -- 4. Book it
  insert into bookings (email, project_id) values (v_student.email, p_project_id);
  return jsonb_build_object('ok', true,
                            'email', v_student.email,
                            'project', v_project.title);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'already_booked');
end;
$$;

-- Only these two functions are callable from the web page.
revoke execute on function public.get_projects() from public;
revoke execute on function public.book_project(text, int) from public;
grant execute on function public.get_projects() to anon, authenticated;
grant execute on function public.book_project(text, int) to anon, authenticated;

-- ============================================================
-- Seed: the 25 projects (capacity 10 each) + seat_counts rows
-- ============================================================

insert into public.projects (id, title, description, api_name, api_url, api_note) values
(1,  'Weather Now',            'Enter a city and show temperature, conditions and a weather icon. The classic Retrofit starter.', 'OpenWeatherMap', 'https://openweathermap.org/api', 'Free API key'),
(2,  'Currency Converter',     'Convert an amount between currencies using live exchange rates.', 'Frankfurter', 'https://frankfurter.dev', 'No key needed'),
(3,  'Dictionary App',         'Type a word and get definitions, phonetics and example sentences.', 'Free Dictionary API', 'https://dictionaryapi.dev', 'No key needed'),
(4,  'Trivia Quiz',            'Multiple-choice quiz with score tracking; pick category and difficulty.', 'Open Trivia DB', 'https://opentdb.com/api_config.php', 'No key needed'),
(5,  'Country Explorer',       'Search any country: flag, capital, population and currency.', 'REST Countries', 'https://restcountries.com', 'No key needed'),
(6,  'Pokédex Lite',           'Scrollable Pokémon list with a detail screen. Great intro to pagination.', 'PokéAPI', 'https://pokeapi.co', 'No key needed'),
(7,  'Recipe Book',            'Search meals and view ingredients and instructions with images.', 'TheMealDB', 'https://www.themealdb.com/api.php', 'Free test key'),
(8,  'Mocktail Menu',          'Browse non-alcoholic drinks by category, with images and recipes.', 'TheCocktailDB', 'https://www.thecocktaildb.com/api.php', 'Free test key'),
(9,  'Movie Search',           'Search movies and show posters, release year and IMDb rating.', 'OMDb API', 'https://www.omdbapi.com', 'Free API key'),
(10, 'News Headlines',         'Top headlines by category in a list; open the full article on tap.', 'NewsAPI.org', 'https://newsapi.org', 'Free API key'),
(11, 'Crypto Price Tracker',   'Live prices of top coins with search and 24-hour change.', 'CoinGecko', 'https://www.coingecko.com/en/api', 'No key needed'),
(12, 'GitHub Profile Finder',  'Enter a username and show avatar, bio, followers and repositories.', 'GitHub REST API', 'https://docs.github.com/en/rest', 'No key needed'),
(13, 'Anime Browser',          'Top and seasonal anime with search and a detail screen.', 'Jikan', 'https://jikan.moe', 'No key needed'),
(14, 'Book Finder',            'Search books and show covers, authors and publish year.', 'Open Library', 'https://openlibrary.org/developers/api', 'No key needed'),
(15, 'NASA Picture of the Day','Daily space image with its explanation, plus a date picker for past days.', 'NASA APOD', 'https://api.nasa.gov', 'Free API key'),
(16, 'Who''s in Space?',       'List astronauts currently in space and show the live ISS position.', 'Open Notify', 'http://open-notify.org', 'No key needed'),
(17, 'SpaceX Launch Tracker',  'Past and upcoming SpaceX launches with mission details.', 'SpaceX API', 'https://github.com/r-spacex/SpaceX-API', 'No key needed'),
(18, 'Joke Machine',           'Random jokes by category with a "next joke" button (use safe-mode).', 'JokeAPI', 'https://jokeapi.dev', 'No key needed'),
(19, 'Daily Quotes',           'Random inspirational quote with a share button.', 'ZenQuotes', 'https://zenquotes.io', 'No key needed'),
(20, 'Advice Generator',       'Tap a card to get a random piece of advice.', 'Advice Slip', 'https://api.adviceslip.com', 'No key needed'),
(21, 'Dog Breed Gallery',      'Pick a dog breed and see random photos of it.', 'Dog CEO', 'https://dog.ceo/dog-api', 'No key needed'),
(22, 'Cat Facts & Pics',       'Random cat image paired with a random cat fact, two APIs in one app.', 'TheCatAPI + catfact.ninja', 'https://thecatapi.com', 'Free API key'),
(23, 'Public Holiday Calendar','Pick a country and year, list all public holidays.', 'Nager.Date', 'https://date.nager.at/Api', 'No key needed'),
(24, 'University Finder',      'Search universities by country and open their websites.', 'Hipolabs Universities', 'http://universities.hipolabs.com', 'No key needed'),
(25, 'Name Predictor',         'Enter a name and predict age, gender and nationality, three parallel Retrofit calls.', 'Agify + Genderize + Nationalize', 'https://agify.io', 'No key needed')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  api_name = excluded.api_name,
  api_url = excluded.api_url,
  api_note = excluded.api_note;

-- Every project gets a seat_counts row up front so Realtime subscribers
-- receive UPDATE events from the first booking onward.
insert into public.seat_counts (project_id, booked)
select p.id, coalesce((select count(*) from public.bookings b where b.project_id = p.id), 0)
from public.projects p
on conflict (project_id) do nothing;
