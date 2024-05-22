drop view if exists "public"."current_top_golfers";

alter table "public"."golfers" drop constraint "golfers_pkey";

drop index if exists "public"."golfers_pkey";

alter table "public"."events" add column "cover_image_url" text;

alter table "public"."events" add column "logo_url" text;

alter table "public"."golf_rankings" add column "as_of_display" text;

alter table "public"."golfers" drop column "id";

alter table "public"."golfers" alter column "pga_id" set not null;

CREATE UNIQUE INDEX events_external_id_key ON public.events USING btree (external_id);

CREATE UNIQUE INDEX golfers_pkey ON public.golfers USING btree (pga_id);

alter table "public"."golfers" add constraint "golfers_pkey" PRIMARY KEY using index "golfers_pkey";

alter table "public"."events" add constraint "events_external_id_key" UNIQUE using index "events_external_id_key";

create or replace view "public"."current_top_golfers" as  SELECT golfers.created_at,
    golfers.first_name,
    golfers.last_name,
    golfers.country,
    golfers.avatar_url,
    golfers.pga_id,
    a.rank
   FROM ( SELECT golf_rankings.week_end_date,
            golf_rankings.created_at,
            golf_rankings."order",
            golf_rankings.as_of_display
           FROM golf_rankings
          ORDER BY golf_rankings.week_end_date DESC
         LIMIT 1) x,
    (LATERAL unnest(x."order") WITH ORDINALITY a(golfer_id, rank)
     JOIN golfers ON ((golfers.pga_id = a.golfer_id)))
  ORDER BY a.rank;



