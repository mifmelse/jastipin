-- Create a moment post + its media atomically (multi-table → one transaction).
-- p_media is a JSON array of { url, type } objects, in display order.
create function create_moment(
  p_trip_id  uuid,
  p_body     text,
  p_location text,
  p_media    jsonb
)
returns uuid
language plpgsql
as $$
declare
  new_id uuid;
begin
  insert into trip_moments (trip_id, body, location, created_by)
  values (p_trip_id, nullif(p_body, ''), nullif(p_location, ''), auth.uid())
  returning id into new_id;

  insert into trip_moment_media (moment_id, url, type, sort_order)
  select new_id, m->>'url', coalesce(m->>'type', 'image'), (ord - 1)::int
  from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) with ordinality as t(m, ord);

  return new_id;
end;
$$;
