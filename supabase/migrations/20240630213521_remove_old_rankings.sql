drop function if exists top_golfers_for_event;

select cron.unschedule(jobname)
from cron.job
where jobname in ('fetch-owgr-rankings', 'process-owgr-rankings', 'fetch-golf-rankings-every-monday');

drop table if exists golf_rankings;