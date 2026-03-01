-- Migration 007: Update dashboard_stats view with correct metrics
--
-- Changes:
-- 1. Cadeiras Concluídas vs total de Pedidos (não vs projetos)
-- 2. Peças em Progresso = assigned OR printing (não só printing)
-- 3. Mantém: Peças Concluídas, Total Doado

-- Drop existing view
DROP VIEW IF EXISTS dashboard_stats;

-- Recreate with updated logic
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  -- Contributors
  (SELECT COUNT(*) FROM contributors) AS total_contributors,

  -- Projects
  (SELECT COUNT(*) FROM project_instances) AS total_projects,
  (SELECT COUNT(*) FROM project_instances WHERE status = 'completed') AS wheelchairs_completed,

  -- Beneficiary Requests (for comparison with completed wheelchairs)
  (SELECT COUNT(*) FROM beneficiary_requests) AS total_requests,

  -- Parts - Total
  (SELECT COUNT(*) FROM project_instance_parts) AS total_parts,

  -- Parts - In Progress (assigned OR printing)
  (SELECT COUNT(*) FROM project_instance_parts
   WHERE status IN ('assigned', 'printing')) AS parts_in_progress,

  -- Parts - Completed (printed, shipped, complete)
  (SELECT COUNT(*) FROM project_instance_parts
   WHERE status IN ('printed', 'shipped', 'complete')) AS parts_completed,

  -- Donations
  (SELECT COUNT(*) FROM donations) AS total_donations,
  (SELECT COALESCE(SUM(amount_cents), 0) FROM donations) AS total_donated_cents;

-- Add comment
COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics view - Updated to show wheelchairs vs requests and correct part progress counts';
