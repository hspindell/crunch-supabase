alter table "public"."events" add column if not exists "polymorphic_data" jsonb;

create or replace function golf_event_field(event_id uuid)
  returns setof golfers
  language sql
as $$
  select golfers.* from 
    (select jsonb_array_elements_text(sub.field_array) as golfer_id from (
        select polymorphic_data::jsonb -> 'field' as field_array
        from events
        where id = event_id
    ) as sub) as field
    join golfers on field.golfer_id = golfers.pga_id
$$;