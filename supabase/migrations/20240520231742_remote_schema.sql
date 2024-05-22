create type "public"."event_type" as enum ('golf-tournament');

create type "public"."pool_type" as enum ('golf-pick-six');

drop policy "Enable read access for all users" on "public"."entries";

create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "starts_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "title" text not null,
    "ends_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "event_type" event_type not null default 'golf-tournament'::event_type,
    "external_id" text
);


alter table "public"."events" enable row level security;

create table "public"."golf_rankings" (
    "week_end_date" date not null,
    "created_at" timestamp with time zone not null default now(),
    "order" integer[] not null default '{}'::integer[]
);


alter table "public"."golf_rankings" enable row level security;

alter table "public"."entries" add column "picks" jsonb;

alter table "public"."golfers" add column "avatar_url" text;

alter table "public"."golfers" add column "pga_id" integer;

alter table "public"."pools" add column "event_id" uuid not null;

alter table "public"."pools" add column "pool_type" pool_type not null default 'golf-pick-six'::pool_type;

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX golf_rankings_pkey ON public.golf_rankings USING btree (week_end_date);

CREATE UNIQUE INDEX golfers_pga_id_key ON public.golfers USING btree (pga_id);

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."golf_rankings" add constraint "golf_rankings_pkey" PRIMARY KEY using index "golf_rankings_pkey";

alter table "public"."golfers" add constraint "golfers_pga_id_key" UNIQUE using index "golfers_pga_id_key";

alter table "public"."pools" add constraint "pools_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) not valid;

alter table "public"."pools" validate constraint "pools_event_id_fkey";

create or replace view "public"."current_top_golfers" as  SELECT golfers.id,
    golfers.created_at,
    golfers.first_name,
    golfers.last_name,
    golfers.country,
    golfers.avatar_url,
    a.rank
   FROM ( SELECT golf_rankings.week_end_date,
            golf_rankings.created_at,
            golf_rankings."order"
           FROM golf_rankings
          ORDER BY golf_rankings.week_end_date DESC
         LIMIT 1) x,
    (LATERAL unnest(x."order") WITH ORDINALITY a(golfer_id, rank)
     JOIN golfers ON ((golfers.id = a.golfer_id)))
  ORDER BY a.rank;


grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."golf_rankings" to "anon";

grant insert on table "public"."golf_rankings" to "anon";

grant references on table "public"."golf_rankings" to "anon";

grant select on table "public"."golf_rankings" to "anon";

grant trigger on table "public"."golf_rankings" to "anon";

grant truncate on table "public"."golf_rankings" to "anon";

grant update on table "public"."golf_rankings" to "anon";

grant delete on table "public"."golf_rankings" to "authenticated";

grant insert on table "public"."golf_rankings" to "authenticated";

grant references on table "public"."golf_rankings" to "authenticated";

grant select on table "public"."golf_rankings" to "authenticated";

grant trigger on table "public"."golf_rankings" to "authenticated";

grant truncate on table "public"."golf_rankings" to "authenticated";

grant update on table "public"."golf_rankings" to "authenticated";

grant delete on table "public"."golf_rankings" to "service_role";

grant insert on table "public"."golf_rankings" to "service_role";

grant references on table "public"."golf_rankings" to "service_role";

grant select on table "public"."golf_rankings" to "service_role";

grant trigger on table "public"."golf_rankings" to "service_role";

grant truncate on table "public"."golf_rankings" to "service_role";

grant update on table "public"."golf_rankings" to "service_role";

create policy "Enable insert for users based on user_id"
on "public"."entries"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Enable read access for all users"
on "public"."events"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."golf_rankings"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."golfers"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."entries"
as permissive
for select
to authenticated
using (true);



