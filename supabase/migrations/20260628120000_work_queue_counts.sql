-- E1: per-status item counts for the dashboard's actionable work queues
-- (items still in flight — not delivered/cancelled). fulfillment_type lets us
-- split the 'pending' stage into sourcing vs drop-in.
create view work_queue_counts as
select status, fulfillment_type, count(*)::int as n
from order_items
where status not in ('delivered', 'cancelled')
group by status, fulfillment_type;
