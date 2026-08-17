-- ============================================================
-- Humble Coders — Project Booking
-- Run this whole file once in the Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists public.students (
  email      text primary key,
  added_at   timestamptz not null default now()
);

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

create table if not exists public.otps (
  email        text primary key,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     int not null default 0,
  last_sent_at timestamptz not null default now()
);

-- ---------- Lock everything down (no direct table access for the web page) ----------

alter table public.students enable row level security;
alter table public.projects enable row level security;
alter table public.bookings enable row level security;
alter table public.otps     enable row level security;
-- No policies on purpose: anon/authenticated cannot read or write tables directly.
-- The only doors in are the two functions below.

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
    'seats_left',  greatest(p.capacity - coalesce(b.cnt, 0), 0)
  ) order by p.id), '[]'::jsonb)
  from public.projects p
  left join (
    select project_id, count(*) as cnt
    from public.bookings
    group by project_id
  ) b on b.project_id = p.id;
$$;

-- ---------- Atomic booking: verify OTP + book, race-safe ----------
-- Concurrency: "for update" on the project row serializes all bookings for
-- that project, so the seat count check is exact — first 10 win, rest get 'full'.

create or replace function public.book_project(p_email text, p_code text, p_project_id int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := lower(trim(p_email));
  v_otp      record;
  v_project  record;
  v_taken    int;
  v_existing text;
begin
  -- 1. Verify the emailed code
  select * into v_otp from otps where email = v_email for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_code');
  end if;
  if v_otp.expires_at < now() then
    delete from otps where email = v_email;
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;
  if v_otp.attempts >= 5 then
    delete from otps where email = v_email;
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;
  if v_otp.code_hash <> encode(digest(trim(p_code), 'sha256'), 'hex') then
    update otps set attempts = attempts + 1 where email = v_email;
    return jsonb_build_object('ok', false, 'error', 'wrong_code',
                              'attempts_left', 4 - v_otp.attempts);
  end if;

  -- 2. One booking per student
  select pr.title into v_existing
  from bookings b join projects pr on pr.id = b.project_id
  where b.email = v_email;
  if found then
    delete from otps where email = v_email;
    return jsonb_build_object('ok', false, 'error', 'already_booked', 'project', v_existing);
  end if;

  -- 3. Lock the project row, then check capacity (race-safe)
  select * into v_project from projects where id = p_project_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_project');
  end if;

  select count(*) into v_taken from bookings where project_id = p_project_id;
  if v_taken >= v_project.capacity then
    delete from otps where email = v_email;
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  -- 4. Book it
  insert into bookings (email, project_id) values (v_email, p_project_id);
  delete from otps where email = v_email;
  return jsonb_build_object('ok', true, 'project', v_project.title);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'already_booked');
end;
$$;

-- Only these two functions are callable from the web page.
revoke execute on function public.get_projects() from public;
revoke execute on function public.book_project(text, text, int) from public;
grant execute on function public.get_projects() to anon, authenticated;
grant execute on function public.book_project(text, text, int) to anon, authenticated;

-- ============================================================
-- Seed: the 25 projects (capacity 10 each)
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
(22, 'Cat Facts & Pics',       'Random cat image paired with a random cat fact — two APIs in one app.', 'TheCatAPI + catfact.ninja', 'https://thecatapi.com', 'Free API key'),
(23, 'Public Holiday Calendar','Pick a country and year, list all public holidays.', 'Nager.Date', 'https://date.nager.at/Api', 'No key needed'),
(24, 'University Finder',      'Search universities by country and open their websites.', 'Hipolabs Universities', 'http://universities.hipolabs.com', 'No key needed'),
(25, 'Name Predictor',         'Enter a name and predict age, gender and nationality — three parallel Retrofit calls.', 'Agify + Genderize + Nationalize', 'https://agify.io', 'No key needed')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  api_name = excluded.api_name,
  api_url = excluded.api_url,
  api_note = excluded.api_note;
