alter table notifications drop column if exists body;

alter table notifications add column if not exists title text;

alter table notifications add column if not exists message text not null;

alter table notifications add column if not exists data jsonb;

create type "public"."push_status" as enum ('pending', 'sent', 'failed');

alter table notifications add column if not exists status push_status not null default 'pending'::push_status;