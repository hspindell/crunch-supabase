ALTER TABLE public.profiles
ADD COLUMN if not exists fcm_token text;

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone not null default now(),
  body text not null
);
