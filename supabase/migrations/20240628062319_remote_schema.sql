set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.mark_pools_complete()
 RETURNS void
 LANGUAGE plpgsql
AS $function$begin
  update pools 
  set concluded = true 
  where id in (
    select p.id from pools p
    join events e on p.event_id = e.id
    where p.concluded = false and e.concluded = true
  );
end$function$
;


