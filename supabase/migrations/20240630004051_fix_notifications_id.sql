alter table notifications drop constraint if exists "notifications_pkey";
alter table notifications add constraint "notifications_pkey" primary key (id);