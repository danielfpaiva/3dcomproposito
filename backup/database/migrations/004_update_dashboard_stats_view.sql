-- ============================================
-- Migration 004: Update dashboard_stats view to use new initiative system
-- ============================================
-- Author: Claude Code
-- Date: 2026-02-20
-- Description: Updates dashboard_stats view to count data from new tables
--              (project_instances, project_instance_parts) instead of legacy tables
-- ============================================

-- Drop and recreate dashboard_stats view with new table references
DROP VIEW IF EXISTS dashboard_stats;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    -- Total number of contributors (unchanged)
    (SELECT COUNT(*) FROM contributors) as total_contributors,

    -- Total number of active projects (using new system)
    (SELECT COUNT(*) FROM project_instances) as total_projects,

    -- Total number of parts across all projects (using new system)
    (SELECT COUNT(*) FROM project_instance_parts) as total_parts,

    -- Completed parts (printed, shipped, or complete)
    (SELECT COUNT(*) FROM project_instance_parts WHERE status IN ('printed', 'shipped', 'complete')) as parts_completed,

    -- Parts currently being printed (status = 'printing')
    (SELECT COUNT(*) FROM project_instance_parts WHERE status = 'printing') as parts_in_progress,

    -- Number of completed wheelchairs/projects (status = 'completed')
    (SELECT COUNT(*) FROM project_instances WHERE status = 'completed') as wheelchairs_completed,

    -- Total donations (unchanged - donations table still exists)
    (SELECT COUNT(*) FROM donations) as total_donations,

    -- Total amount donated in cents (unchanged)
    (SELECT COALESCE(SUM(amount_cents), 0) FROM donations) as total_donated_cents;

COMMENT ON VIEW dashboard_stats IS 'Dashboard statistics using new initiative template system (project_instances + project_instance_parts)';

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================

-- Verify the view returns data:
-- SELECT * FROM dashboard_stats;

-- Compare old vs new counts:
-- SELECT
--   'OLD' as system,
--   COUNT(*) as projects,
--   (SELECT COUNT(*) FROM parts) as parts
-- FROM wheelchair_projects
-- UNION ALL
-- SELECT
--   'NEW' as system,
--   COUNT(*) as projects,
--   (SELECT COUNT(*) FROM project_instance_parts) as parts
-- FROM project_instances;
