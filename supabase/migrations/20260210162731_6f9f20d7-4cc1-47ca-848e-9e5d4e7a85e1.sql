
-- Fix dashboard_stats view to use security invoker
DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats WITH (security_invoker=on) AS
SELECT
  (SELECT count(*) FROM public.contributors) AS total_contributors,
  (SELECT count(*) FROM public.wheelchair_projects WHERE status = 'complete') AS wheelchairs_completed,
  (SELECT count(*) FROM public.wheelchair_projects) AS total_projects,
  (SELECT count(*) FROM public.parts WHERE status = 'complete') AS parts_completed,
  (SELECT count(*) FROM public.parts WHERE status IN ('assigned','printing','printed','shipped')) AS parts_in_progress,
  (SELECT count(*) FROM public.parts) AS total_parts;

-- Also fix regional_stats view
DROP VIEW IF EXISTS public.regional_stats;
CREATE VIEW public.regional_stats WITH (security_invoker=on) AS
SELECT region, count(*) AS contributor_count, count(DISTINCT printer_model) AS printer_count
FROM public.contributors
GROUP BY region;
