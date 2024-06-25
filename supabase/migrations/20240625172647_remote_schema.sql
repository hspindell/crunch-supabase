drop policy "Enable insert if pool is public" on "public"."entries";

drop policy "Insert entry if user in pool's circle" on "public"."entries";

drop policy "Enable insert for users based on user_id" on "public"."entries";

drop view if exists "public"."current_top_golfers";

alter table "public"."entries" alter column "profile_id" set default auth.uid();

alter table "public"."events" drop column "ends_at";

alter table "public"."events" add column "concluded" boolean not null default false;

alter table "public"."events" add column "estimated_ends_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."golf_rankings" alter column "order" drop default;

alter table "public"."golf_rankings" alter column "order" set data type text[] using "order"::text[];

alter table "public"."golfers" alter column "pga_id" set data type text using "pga_id"::text;

alter table "public"."profiles_circles" add column "created_at" timestamp with time zone not null default now();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.top_golfers_for_event(start_date date)
 RETURNS SETOF record
 LANGUAGE sql
AS $function$select golfers.*, a.rank from ( 
        select * from golf_rankings 
        where week_end_date < start_date
        order by week_end_date desc 
        limit 1) as x, lateral unnest("order") with ordinality as a(golfer_id, rank)
        join golfers on golfers.pga_id = a.golfer_id
        order by rank asc;$function$
;

create policy "Enable update for users based on user_id"
on "public"."entries"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Enable insert for users based on user_id"
on "public"."profiles_circles"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Enable insert for users based on user_id"
on "public"."entries"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = profile_id));



