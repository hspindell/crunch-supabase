alter table "public"."pools" add column if not exists "concluded" boolean not null default false;