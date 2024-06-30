select
  cron.schedule(
    'conclude-pools-daily',
    '0 0 * * *',
    $$
      select mark_pools_complete()
    $$
  );


-- -- -- -- 

CREATE OR REPLACE FUNCTION "public"."notify_owner_new_circle_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    declare
    _circle record;
    _member record;
  begin
    select into _circle
    id, title, owner_id
    from public.circles
    where id = new.circle_id;
  
    select into _member
    id, username
    from public.profiles
    where id = new.profile_id;
  
    if _member.id <> _circle.owner_id then
      insert into public.notifications(user_id, title, message, data)
      values(_circle.owner_id, _circle.title, concat(_member.username, ' has joined your circle!'), 
      ('{ "circle_id": "' || _circle.id::text || '" }')::jsonb);
    end if;
  
    return new;
end$$;

CREATE OR REPLACE FUNCTION "public"."notify_admin_new_pool_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
    declare
    _pool record;
    _entry_user record;
  begin
    select into _pool
    id, title, admin_id
    from public.pools
    where id = new.pool_id;
  
    select into _entry_user
    id, username
    from public.profiles
    where id = new.profile_id;
  
    if _entry_user.id <> _pool.admin_id then
      insert into public.notifications(user_id, title, message, data)
      values(_pool.admin_id, _pool.title, concat(_entry_user.username, ' has joined your pool!'),
      ('{ "pool_id": "' || _pool.id::text || '" }')::jsonb);
    end if;
  
    return new;
end$$;


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

-- -- --

CREATE OR REPLACE TRIGGER "notify_admin_new_pool_entry_trigger" AFTER INSERT ON "public"."entries" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_new_pool_entry"();
CREATE OR REPLACE TRIGGER "notify_owner_new_circle_member_trigger" AFTER INSERT ON "public"."profiles_circles" FOR EACH ROW EXECUTE FUNCTION "public"."notify_owner_new_circle_member"();
CREATE OR REPLACE TRIGGER "pool_concluded" 
AFTER UPDATE ON "public"."pools" 
FOR EACH ROW 
when ((new.concluded) and (new.concluded is distinct from old.concluded))
EXECUTE FUNCTION "public"."notify_entrants_pool_ended"();