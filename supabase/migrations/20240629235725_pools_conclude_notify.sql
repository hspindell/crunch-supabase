select
  cron.schedule(
    'conclude-pools-daily',
    '0 0 * * *',
    $$
      select mark_pools_complete()
    $$
  );

CREATE OR REPLACE FUNCTION "public"."notify_entrants_pool_ended"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  begin
    INSERT INTO notifications (user_id, title, message, data)
    SELECT 
    e.profile_id,
    new.title,
    'This pool has concluded. Pay up!',
    ('{ "pool_id": "' || new.id::text || '" }')::jsonb
    FROM
        entries e
    WHERE
        e.pool_id = new.id;
  
    return new;
end$$;

CREATE OR REPLACE TRIGGER "pool_concluded" 
AFTER UPDATE ON "public"."pools" 
FOR EACH ROW 
when (new.concluded) and (new.concluded is distinct from old.concluded)
EXECUTE FUNCTION "public"."notify_entrants_pool_ended"();