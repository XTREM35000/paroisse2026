-- Repair rpc_increment_viewer function to remove ambiguous column references
-- and simplify its implementation. The previous definition sometimes
-- produced a "column reference \"live_id\" is ambiguous" error when
-- called via the Supabase RPC endpoint, because the return-table column
-- had the same name as a table column used in the body. That caused the
-- SQL planner to complain when evaluating the ON CONFLICT clause.
--
-- This migration replaces the function with a version that:
--   * performs the insert/update logic exactly as before
--   * returns results using RETURN QUERY (no INTO variables)
--   * never introduces a local PL/pgSQL variable named `live_id`
--
-- After applying, the front‑end calls to rpc_increment_viewer should
-- succeed without producing 400 errors.

CREATE OR REPLACE FUNCTION public.rpc_increment_viewer(
  p_live_id uuid,
  p_delta integer,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  live_id uuid,
  viewers_count integer,
  peak_viewers integer,
  total_views bigint,
  updated_at timestamptz
) AS $$
BEGIN
  -- insert a new stats row if missing or update existing atomically
  INSERT INTO public.live_stats (live_id, viewers_count, peak_viewers, total_views)
  VALUES (
    p_live_id,
    GREATEST(p_delta,0),
    GREATEST(p_delta,0),
    GREATEST(p_delta,0)
  )
  ON CONFLICT (live_id) DO UPDATE
    SET
      viewers_count = GREATEST(public.live_stats.viewers_count + GREATEST(p_delta, - public.live_stats.viewers_count), 0),
      peak_viewers = GREATEST(GREATEST(public.live_stats.viewers_count + p_delta, 0), public.live_stats.peak_viewers),
      total_views = public.live_stats.total_views + CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END,
      updated_at = now();

  -- return the updated row
  RETURN QUERY
    SELECT live_id, viewers_count, peak_viewers, total_views, updated_at
    FROM public.live_stats
    WHERE live_id = p_live_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
